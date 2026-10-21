-- =====================================================================
-- Maxeados · Capa de juego pixel art
-- Personaje obligatorio, ranking con avatar, feed de actividad,
-- verificación de peso con recálculo y apertura de temporadas.
-- =====================================================================

-- ---------- Personaje pixel art (obligatorio para terminar el onboarding) ----------
alter table public.profiles add column avatar jsonb;

alter table public.profiles drop column onboarded;
alter table public.profiles add column onboarded boolean generated always as (
    full_name is not null and body_weight_kg is not null and avatar is not null
) stored;

-- ---------- Leaderboard: igual que antes + avatar ----------
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
    ) as position,
    p.avatar
from best b
join public.profiles p on p.id = b.user_id
join public.machines m on m.id = b.machine_id
group by b.season_id, p.id;

-- ---------- Feed de actividad: últimos intentos aprobados (sin video ni datos privados) ----------
create or replace view public.activity_feed
with (security_invoker = false) as
select
    s.id,
    s.season_id,
    p.full_name,
    m.name as machine_name,
    m.slug as machine_slug,
    s.reps_completed,
    s.calculated_score,
    s.reviewed_at
from public.submissions s
join public.profiles p on p.id = s.user_id
join public.machines m on m.id = s.machine_id
where s.status = 'APPROVED';

grant select on public.activity_feed to authenticated;
revoke select on public.activity_feed from anon;

-- ---------- Juez: verificar peso oficial y recalcular la temporada activa ----------
create or replace function public.verify_weight(p_user uuid, p_weight numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
    if not public.is_admin() then
        raise exception 'Solo un juez puede verificar pesos';
    end if;
    if p_weight is null or p_weight < 30 or p_weight > 300 then
        raise exception 'Peso fuera de rango';
    end if;

    update public.profiles set body_weight_kg = p_weight, weight_verified = true where id = p_user;

    -- Tocar reps_completed dispara compute_submission_score con el nuevo snapshot.
    update public.submissions s
       set body_weight_snapshot = p_weight, reps_completed = s.reps_completed
     where s.user_id = p_user
       and s.season_id in (select id from public.seasons where is_active);
end;
$$;
revoke execute on function public.verify_weight(uuid, numeric) from public, anon;
grant execute on function public.verify_weight(uuid, numeric) to authenticated;

-- ---------- Juez: abrir una temporada nueva (cierra la activa) ----------
create or replace function public.open_season(p_title text, p_start date, p_end date, p_prize numeric)
returns uuid language plpgsql security definer set search_path = public as $$
declare
    v_id uuid;
begin
    if not public.is_admin() then
        raise exception 'Solo un juez puede abrir temporadas';
    end if;
    update public.seasons set is_active = false where is_active;
    insert into public.seasons (title, start_date, end_date, prize_amount_cop, is_active)
    values (p_title, p_start, p_end, coalesce(p_prize, 100000), true)
    returning id into v_id;
    return v_id;
end;
$$;
revoke execute on function public.open_season(text, date, date, numeric) from public, anon;
grant execute on function public.open_season(text, date, date, numeric) to authenticated;
