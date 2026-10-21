-- =====================================================================
-- Maxeados · Esquema inicial
-- =====================================================================

-- ---------- Tipos ----------
create type public.user_role as enum ('ATHLETE', 'ADMIN');
create type public.submission_status as enum ('PENDING', 'APPROVED', 'REJECTED');

-- ---------- Perfiles (1:1 con auth.users) ----------
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name varchar(120),
    email varchar(120) unique not null,
    phone varchar(20),
    avatar_url text,
    body_weight_kg numeric(5,2) check (body_weight_kg between 30 and 300),
    weight_verified boolean not null default false,
    role public.user_role not null default 'ATHLETE',
    onboarded boolean generated always as (full_name is not null and body_weight_kg is not null) stored,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------- Catálogo de máquinas ----------
create table public.machines (
    id uuid primary key default gen_random_uuid(),
    slug varchar(50) unique not null,
    name varchar(100) not null,
    muscle_group varchar(50) not null,
    max_weight_kg numeric(6,2) not null check (max_weight_kg > 0),
    sort_order int not null default 0,
    is_active boolean not null default true
);

-- ---------- Temporadas ----------
create table public.seasons (
    id uuid primary key default gen_random_uuid(),
    title varchar(100) not null,
    prize_amount_cop numeric(10,2) not null default 100000.00,
    start_date date not null,
    end_date date not null,
    is_active boolean not null default true,
    check (end_date > start_date)
);
-- Solo una temporada activa a la vez
create unique index seasons_one_active on public.seasons (is_active) where is_active;

-- ---------- Intentos ----------
create table public.submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    machine_id uuid not null references public.machines(id),
    season_id uuid not null references public.seasons(id),
    reps_completed int not null check (reps_completed > 0),
    reps_counted int not null,                 -- clamp 1..15 (trigger)
    body_weight_snapshot numeric(5,2) not null, -- PC al momento del envío (trigger)
    machine_weight_snapshot numeric(6,2) not null, -- W_m al momento del envío (trigger)
    evidence_path text,                         -- archivo en Storage (bucket evidence)
    evidence_url text,                          -- link externo opcional (IG / Drive / YT)
    evidence_type varchar(10) check (evidence_type in ('video', 'photo', 'link')),
    calculated_score numeric(8,4) not null,     -- P_m (trigger)
    status public.submission_status not null default 'PENDING',
    admin_notes text,
    reviewed_by uuid references public.profiles(id),
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    check (evidence_path is not null or evidence_url is not null)
);
create index submissions_status_idx on public.submissions (status, created_at);
create index submissions_user_season_idx on public.submissions (user_id, season_id);

-- =====================================================================
-- Funciones y triggers
-- =====================================================================

-- ¿Es admin el usuario actual? (security definer para evitar recursión RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN');
$$;

-- Crear perfil automáticamente al registrarse (Google OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_touch before update on public.profiles
    for each row execute function public.touch_updated_at();

-- Proteger campos sensibles del perfil: un atleta no puede auto-asignarse ADMIN
-- ni marcar su peso como verificado; si cambia su peso, pierde la verificación.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if not public.is_admin() then
        new.role = old.role;
        new.email = old.email;
        new.weight_verified = case
            when new.body_weight_kg is distinct from old.body_weight_kg then false
            else old.weight_verified end;
    end if;
    return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
    for each row execute function public.guard_profile_update();

-- Cálculo de puntaje: P_m = (W_m / PC) * (1 + R/30), R = min(reps, 15)
create or replace function public.compute_submission_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_pc numeric(5,2);
    v_wm numeric(6,2);
begin
    if tg_op = 'INSERT' then
        select body_weight_kg into v_pc from public.profiles where id = new.user_id;
        if v_pc is null then
            raise exception 'El atleta debe registrar su peso corporal antes de enviar intentos';
        end if;

        select max_weight_kg into v_wm from public.machines where id = new.machine_id and is_active;
        if v_wm is null then
            raise exception 'Máquina inválida o inactiva';
        end if;

        -- Forzar temporada activa y estado inicial
        select id into new.season_id from public.seasons
            where is_active and current_date between start_date and end_date limit 1;
        if new.season_id is null then
            raise exception 'No hay una temporada activa';
        end if;

        new.status = 'PENDING';
        new.admin_notes = null;
        new.reviewed_by = null;
        new.reviewed_at = null;
        new.body_weight_snapshot = v_pc;
        new.machine_weight_snapshot = v_wm;
    end if;

    new.reps_counted = least(greatest(new.reps_completed, 1), 15);
    new.calculated_score = round(
        (new.machine_weight_snapshot / new.body_weight_snapshot) * (1 + new.reps_counted / 30.0), 4);
    return new;
end;
$$;
create trigger submissions_score before insert or update of reps_completed on public.submissions
    for each row execute function public.compute_submission_score();

-- Auditoría de revisión
create or replace function public.stamp_review()
returns trigger language plpgsql as $$
begin
    if new.status is distinct from old.status then
        new.reviewed_by = auth.uid();
        new.reviewed_at = now();
    end if;
    return new;
end;
$$;
create trigger submissions_review before update of status on public.submissions
    for each row execute function public.stamp_review();

-- =====================================================================
-- Leaderboard
-- =====================================================================
-- Mejor puntaje aprobado por máquina, suma global, máquinas completadas,
-- desempate por menor peso corporal.
create or replace view public.leaderboard
with (security_invoker = false) as
with best as (
    select s.season_id, s.user_id, s.machine_id, max(s.calculated_score) as best_score
    from public.submissions s
    where s.status = 'APPROVED'
    group by s.season_id, s.user_id, s.machine_id
)
select
    b.season_id,
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.body_weight_kg,
    p.weight_verified,
    round(sum(b.best_score), 4) as total_score,
    count(*)::int as machines_completed,
    (count(*) = (select count(*) from public.machines where is_active)) as qualified,
    jsonb_object_agg(m.slug, b.best_score) as breakdown,
    rank() over (
        partition by b.season_id
        order by sum(b.best_score) desc, p.body_weight_kg asc
    ) as position
from best b
join public.profiles p on p.id = b.user_id
join public.machines m on m.id = b.machine_id
group by b.season_id, p.id;

grant select on public.leaderboard to authenticated;
revoke select on public.leaderboard from anon;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.seasons enable row level security;
alter table public.submissions enable row level security;

-- profiles
create policy "profiles: ver el propio o admin" on public.profiles
    for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: editar el propio o admin" on public.profiles
    for update to authenticated using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());

-- machines / seasons: lectura para autenticados, escritura solo admin
create policy "machines: lectura" on public.machines for select to authenticated using (true);
create policy "machines: admin" on public.machines for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
create policy "seasons: lectura" on public.seasons for select to authenticated using (true);
create policy "seasons: admin" on public.seasons for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

-- submissions
create policy "submissions: ver propias o admin" on public.submissions
    for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "submissions: crear propias" on public.submissions
    for insert to authenticated with check (user_id = auth.uid());
create policy "submissions: admin modera" on public.submissions
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Storage: bucket privado de evidencias  (ruta: {user_id}/{archivo})
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'evidence', 'evidence', false, 104857600, -- 100 MB
    array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;

create policy "evidence: subir a su carpeta" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "evidence: ver propia o admin" on storage.objects
    for select to authenticated
    using (bucket_id = 'evidence' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
