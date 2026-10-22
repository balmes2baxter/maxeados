-- =====================================================================
-- Maxeados · Script consolidado con todo lo pendiente
-- Pega este script completo en Supabase SQL Editor y dale "Run".
-- =====================================================================

-- 1. Insertar las 6 máquinas oficiales (si no existen)
insert into public.machines (slug, name, muscle_group, max_weight_kg, sort_order) values
    ('leg-press',      'Prensa de piernas / Hack squat',   'Cuádriceps / Glúteos',  300.00, 1),
    ('leg-extension',  'Extensión de cuádriceps',          'Cuádriceps',            100.00, 2),
    ('leg-curl',       'Curl femoral acostado / sentado',  'Isquiotibiales',         90.00, 3),
    ('lat-pulldown',   'Jalón al pecho en polea',          'Dorsales',              120.00, 4),
    ('seated-row',     'Remo sentado en polea / máquina',  'Espalda media',         120.00, 5),
    ('chest-press',    'Press de pecho en máquina',        'Pecho / Tríceps',       120.00, 6)
on conflict (slug) do nothing;

-- 2. Insertar temporada inicial activa
insert into public.seasons (title, prize_amount_cop, start_date, end_date, is_active)
select 'Temporada Piloto', 100000.00, current_date, current_date + 30, true
where not exists (select 1 from public.seasons where is_active);

-- 3. Columnas de competencia y geolocalización
alter table public.submissions add column if not exists lifted_weight_kg numeric(6,2);
update public.submissions set lifted_weight_kg = machine_weight_snapshot where lifted_weight_kg is null;
alter table public.submissions alter column lifted_weight_kg set not null;

alter table public.submissions
    add column if not exists geo_lat double precision,
    add column if not exists geo_lng double precision,
    add column if not exists geo_distance_m int;

alter table public.seasons
    add column if not exists gym_name varchar(100),
    add column if not exists gym_lat double precision check (gym_lat between -90 and 90),
    add column if not exists gym_lng double precision check (gym_lng between -180 and 180),
    add column if not exists gym_radius_m int not null default 150 check (gym_radius_m between 30 and 2000);

-- Función de distancia
create or replace function public.distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
    select 2 * 6371000 * asin(sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2) +
        cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ));
$$;

-- Trigger de puntaje actualizado
create or replace function public.compute_submission_score()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_pc numeric(5,2);
    v_wm numeric(6,2);
    v_season public.seasons%rowtype;
    v_dist double precision;
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
        if new.lifted_weight_kg is null or new.lifted_weight_kg <= 0 or new.lifted_weight_kg > v_wm then
            raise exception 'El peso debe estar entre 1 y % kg (tope de la pila)', v_wm;
        end if;

        select * into v_season from public.seasons
            where is_active and current_date between start_date and end_date limit 1;
        if v_season.id is null then
            raise exception 'No hay una temporada activa';
        end if;
        new.season_id = v_season.id;

        if auth.uid() is not null then
            if v_season.gym_lat is not null and (new.geo_lat is not null and new.geo_lng is not null) then
                v_dist = public.distance_m(new.geo_lat, new.geo_lng, v_season.gym_lat, v_season.gym_lng);
                new.geo_distance_m = round(v_dist);
            end if;
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
        (new.lifted_weight_kg / new.body_weight_snapshot) * (1 + new.reps_counted / 30.0), 4);
    return new;
end;
$$;

-- Vista de actividad
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
    s.reviewed_at,
    s.lifted_weight_kg
from public.submissions s
join public.profiles p on p.id = s.user_id
join public.machines m on m.id = s.machine_id
where s.status = 'APPROVED';

-- 4. Tienda y compras
create table if not exists public.shop_items (
    id varchar(40) primary key,
    name varchar(60) not null,
    price int not null check (price > 0),
    sort_order int not null default 0
);

insert into public.shop_items (id, name, price, sort_order) values
    ('headgear:corona',  'Corona',        300, 1),
    ('back:alas',        'Alas',          400, 2),
    ('headgear:vikingo', 'Casco vikingo', 220, 3),
    ('back:capa',        'Capa',          180, 4),
    ('neck:medalla',     'Medalla',       120, 5),
    ('hand:pesa',        'Pesa rusa',     100, 6),
    ('extra:pintura',    'Pintura',        90, 7),
    ('top:jersey',       'Jersey',         80, 8)
on conflict (id) do nothing;

create table if not exists public.purchases (
    user_id uuid not null references public.profiles(id) on delete cascade,
    item_id varchar(40) not null references public.shop_items(id),
    price int not null,
    created_at timestamptz not null default now(),
    primary key (user_id, item_id)
);

alter table public.shop_items enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "shop_items: lectura" on public.shop_items;
create policy "shop_items: lectura" on public.shop_items for select to authenticated using (true);

drop policy if exists "purchases: ver propias" on public.purchases;
create policy "purchases: ver propias" on public.purchases for select to authenticated using (user_id = auth.uid());

create or replace function public.coin_balance(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
    select 100
        + coalesce((select count(*) * 10 + count(*) filter (where status = 'APPROVED') * 40
                    from public.submissions where user_id = p_user), 0)::int
        - coalesce((select sum(price) from public.purchases where user_id = p_user), 0)::int;
$$;
revoke execute on function public.coin_balance(uuid) from public, anon;
grant execute on function public.coin_balance(uuid) to authenticated;

create or replace function public.buy_item(p_item varchar)
returns int language plpgsql security definer set search_path = public as $$
declare
    v_price int;
    v_balance int;
begin
    if auth.uid() is null then raise exception 'Inicia sesión'; end if;
    select price into v_price from public.shop_items where id = p_item;
    if v_price is null then raise exception 'Ese artículo no existe'; end if;
    if exists (select 1 from public.purchases where user_id = auth.uid() and item_id = p_item) then
        raise exception 'Ya lo tienes';
    end if;
    perform 1 from public.profiles where id = auth.uid() for update;
    v_balance = public.coin_balance(auth.uid());
    if v_balance < v_price then
        raise exception 'Te faltan % fichas', v_price - v_balance;
    end if;
    insert into public.purchases (user_id, item_id, price) values (auth.uid(), p_item, v_price);
    return v_balance - v_price;
end;
$$;
revoke execute on function public.buy_item(varchar) from public, anon;
grant execute on function public.buy_item(varchar) to authenticated;
