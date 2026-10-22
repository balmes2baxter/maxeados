-- =====================================================================
-- Maxeados · Competencia real
-- El atleta declara el peso que movió (ya no se asume el tope de la pila)
-- y solo puede enviar intentos desde la ubicación del gimnasio.
-- =====================================================================

-- ---------- Peso declarado por intento ----------
alter table public.submissions add column lifted_weight_kg numeric(6,2);
update public.submissions set lifted_weight_kg = machine_weight_snapshot where lifted_weight_kg is null;
alter table public.submissions alter column lifted_weight_kg set not null;
alter table public.submissions add constraint submissions_lifted_positive check (lifted_weight_kg > 0);

-- ---------- Dónde se hizo el intento ----------
alter table public.submissions
    add column geo_lat double precision,
    add column geo_lng double precision,
    add column geo_distance_m int;

-- ---------- Gimnasio de la temporada ----------
alter table public.seasons
    add column gym_name varchar(100),
    add column gym_lat double precision check (gym_lat between -90 and 90),
    add column gym_lng double precision check (gym_lng between -180 and 180),
    add column gym_radius_m int not null default 150 check (gym_radius_m between 30 and 2000);

-- Distancia en metros entre dos coordenadas (haversine)
create or replace function public.distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
    select 2 * 6371000 * asin(sqrt(
        power(sin(radians(lat2 - lat1) / 2), 2) +
        cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ));
$$;

-- Puntaje: P_m = (peso movido / PC) * (1 + R/30), R = min(reps, 15), peso movido <= tope de la pila
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

        -- Forzar temporada activa y estado inicial
        select * into v_season from public.seasons
            where is_active and current_date between start_date and end_date limit 1;
        if v_season.id is null then
            raise exception 'No hay una temporada activa';
        end if;
        new.season_id = v_season.id;

        -- Los atletas solo envían desde el gimnasio (los seeds sin sesión quedan fuera)
        if auth.uid() is not null then
            if v_season.gym_lat is null then
                raise exception 'El juez todavía no ha fijado la ubicación del gimnasio';
            end if;
            if new.geo_lat is null or new.geo_lng is null then
                raise exception 'Activa tu ubicación para enviar el intento';
            end if;
            v_dist = public.distance_m(new.geo_lat, new.geo_lng, v_season.gym_lat, v_season.gym_lng);
            if v_dist > v_season.gym_radius_m then
                raise exception 'Estás a % m del gimnasio. Solo se puede enviar desde el gym', round(v_dist);
            end if;
            new.geo_distance_m = round(v_dist);
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

-- ---------- Feed de actividad: ahora muestra el peso movido ----------
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
