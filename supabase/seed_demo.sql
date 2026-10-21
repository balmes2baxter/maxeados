-- Datos de demostración SOLO para Supabase local (`npx supabase db reset`).
-- Crea un juez y 8 atletas con personaje, intentos aprobados, pendientes y rechazados.
-- Todos entran en "Modo desarrollo" con la contraseña maxeados-dev. No usar en producción.

do $$
declare
    v_pw text := crypt('maxeados-dev', gen_salt('bf'));
    v_uid uuid;
    v_season uuid;
    v_m record;
    v_i int := 0;
    v_reps int;
    v_sub uuid;
    a record;
begin
    select id into v_season from public.seasons where is_active limit 1;
    -- Temporada que empezó hace 9 días, para que haya historia
    update public.seasons set start_date = current_date - 9, end_date = current_date + 20 where id = v_season;

    for a in
        select * from (values
            ('juez@maxeados.dev', 'Juez Maxeados', 80.0, true, 'ADMIN',
             '{"build":"atletico","skin":3,"hair":"corto","hairColor":5,"facial":"bigote","top":"camiseta","topColor":7,"bottom":"joggers","bottomColor":7,"shoeColor":6,"headgear":"gorra","gearColor":1,"extra":"ninguno","belt":false,"wristbands":false}',
             array[0,0,0,0,0,0], 0),
            ('valentina@demo.maxeados', 'Valentina Ríos', 58.0, true, 'ATHLETE',
             '{"build":"flaco","skin":1,"hair":"cola","hairColor":2,"facial":"ninguno","top":"top","topColor":2,"bottom":"licra","bottomColor":7,"shoeColor":6,"headgear":"bandana","gearColor":3,"extra":"ninguno","belt":false,"wristbands":false}',
             array[12,15,10,9,11,8], 1),
            ('andres@demo.maxeados', 'Andrés ''El Toro'' Gómez', 92.0, true, 'ATHLETE',
             '{"build":"mamado","skin":3,"hair":"rapado","hairColor":0,"facial":"barba","top":"descubierto","topColor":0,"bottom":"shorts","bottomColor":8,"shoeColor":6,"headgear":"ninguno","gearColor":2,"extra":"ninguno","belt":true,"wristbands":true}',
             array[15,12,9,10,12,14], 0),
            ('camila@demo.maxeados', 'Camila Herrera', 64.0, false, 'ATHLETE',
             '{"build":"atletico","skin":0,"hair":"largo","hairColor":3,"facial":"ninguno","top":"esqueleto","topColor":5,"bottom":"joggers","bottomColor":7,"shoeColor":6,"headgear":"audifonos","gearColor":1,"extra":"ninguno","belt":false,"wristbands":false}',
             array[10,11,12,8,9,0], 2),
            ('juanpablo@demo.maxeados', 'Juan Pablo Mejía', 78.0, true, 'ATHLETE',
             '{"build":"atletico","skin":2,"hair":"puntas","hairColor":4,"facial":"ninguno","top":"camiseta","topColor":3,"bottom":"shorts","bottomColor":7,"shoeColor":6,"headgear":"ninguno","gearColor":2,"extra":"gafas","belt":false,"wristbands":false}',
             array[9,10,8,11,10,9], 1),
            ('sofia@demo.maxeados', 'Sofía Cardona', 61.0, true, 'ATHLETE',
             '{"build":"atletico","skin":4,"hair":"afro","hairColor":0,"facial":"ninguno","top":"top","topColor":0,"bottom":"licra","bottomColor":5,"shoeColor":6,"headgear":"ninguno","gearColor":2,"extra":"cadena","belt":false,"wristbands":false}',
             array[13,9,11,7,0,0], 1),
            ('mateo@demo.maxeados', 'Mateo Restrepo', 85.0, false, 'ATHLETE',
             '{"build":"mamado","skin":5,"hair":"mohicano","hairColor":7,"facial":"bigote","top":"hoodie","topColor":7,"bottom":"joggers","bottomColor":7,"shoeColor":6,"headgear":"ninguno","gearColor":2,"extra":"ninguno","belt":false,"wristbands":false}',
             array[8,7,6,9,8,10], 0),
            ('daniela@demo.maxeados', 'Daniela Ospina', 55.0, true, 'ATHLETE',
             '{"build":"flaco","skin":1,"hair":"corto","hairColor":6,"facial":"ninguno","top":"camiseta","topColor":6,"bottom":"shorts","bottomColor":2,"shoeColor":6,"headgear":"gorra","gearColor":4,"extra":"ninguno","belt":false,"wristbands":false}',
             array[6,8,0,5,0,0], 1),
            ('santiago@demo.maxeados', 'Santiago Vélez', 101.0, true, 'ATHLETE',
             '{"build":"mamado","skin":2,"hair":"calvo","hairColor":1,"facial":"barba","top":"esqueleto","topColor":4,"bottom":"shorts","bottomColor":7,"shoeColor":6,"headgear":"ninguno","gearColor":2,"extra":"ninguno","belt":true,"wristbands":false}',
             array[15,10,8,6,7,9], 0)
        ) as t(email, name, weight, verified, role, avatar, reps, pending)
    loop
        v_i := v_i + 1;
        if exists (select 1 from auth.users where email = a.email) then continue; end if;
        v_uid := gen_random_uuid();

        insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                                raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                                confirmation_token, recovery_token, email_change_token_new, email_change)
        values ('00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', a.email, v_pw, now(),
                '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', a.name), now(), now(),
                '', '', '', '');
        insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (gen_random_uuid(), v_uid, v_uid::text, jsonb_build_object('sub', v_uid::text, 'email', a.email),
                'email', now(), now(), now());

        -- El trigger handle_new_user ya creó el perfil. El guard impide fijar rol/verificación
        -- sin sesión de juez, así que se apaga solo para este update.
        alter table public.profiles disable trigger profiles_guard;
        update public.profiles
           set full_name = a.name, body_weight_kg = a.weight, weight_verified = a.verified,
               role = a.role::public.user_role, avatar = a.avatar::jsonb
         where id = v_uid;
        alter table public.profiles enable trigger profiles_guard;

        for v_m in select id, sort_order from public.machines where is_active order by sort_order loop
            v_reps := a.reps[v_m.sort_order];
            if v_reps is null or v_reps = 0 then continue; end if;
            -- Un intento previo más flojo y el mejor, ambos aprobados
            if v_reps > 4 then
                insert into public.submissions (user_id, machine_id, season_id, reps_completed, reps_counted,
                    body_weight_snapshot, machine_weight_snapshot, calculated_score, evidence_url, evidence_type, created_at)
                values (v_uid, v_m.id, v_season, v_reps - 3, 0, 0, 0, 0,
                    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'link', now() - ((v_m.sort_order * 3 + v_i) % 9 + 2) * interval '1 day')
                returning id into v_sub;
                update public.submissions set status = 'APPROVED' where id = v_sub;
            end if;
            insert into public.submissions (user_id, machine_id, season_id, reps_completed, reps_counted,
                body_weight_snapshot, machine_weight_snapshot, calculated_score, evidence_url, evidence_type, created_at)
            values (v_uid, v_m.id, v_season, v_reps, 0, 0, 0, 0,
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'link', now() - ((v_m.sort_order * 3 + v_i) % 9) * interval '1 day')
            returning id into v_sub;
            update public.submissions set status = 'APPROVED', reviewed_at = now() - ((v_m.sort_order + v_i) % 7) * interval '1 day' where id = v_sub;
        end loop;

        -- Intentos pendientes para la cola del juez
        for v_m in select id from public.machines where is_active order by sort_order desc limit a.pending loop
            insert into public.submissions (user_id, machine_id, season_id, reps_completed, reps_counted,
                body_weight_snapshot, machine_weight_snapshot, calculated_score, evidence_url, evidence_type)
            values (v_uid, v_m.id, v_season, 10 + v_i % 6, 0, 0, 0, 0,
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'link');
        end loop;

        -- Un rechazado con retroalimentación
        if v_i % 2 = 0 then
            insert into public.submissions (user_id, machine_id, season_id, reps_completed, reps_counted,
                body_weight_snapshot, machine_weight_snapshot, calculated_score, evidence_url, evidence_type, created_at)
            select v_uid, id, v_season, 18, 0, 0, 0, 0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'link', now() - interval '5 days'
              from public.machines where is_active order by sort_order limit 1
            returning id into v_sub;
            update public.submissions set status = 'REJECTED', admin_notes = 'Rango incompleto' where id = v_sub;
        end if;
    end loop;
end $$;
