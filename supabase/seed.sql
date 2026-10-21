-- Seed: circuito oficial + temporada piloto
-- ⚠️ Ajustar max_weight_kg con el tope REAL de cada máquina del gimnasio piloto.
insert into public.machines (slug, name, muscle_group, max_weight_kg, sort_order) values
    ('leg-press',      'Prensa de piernas / Hack squat',   'Cuádriceps / Glúteos',  300.00, 1),
    ('leg-extension',  'Extensión de cuádriceps',          'Cuádriceps',            100.00, 2),
    ('leg-curl',       'Curl femoral acostado / sentado',  'Isquiotibiales',         90.00, 3),
    ('lat-pulldown',   'Jalón al pecho en polea',          'Dorsales',              120.00, 4),
    ('seated-row',     'Remo sentado en polea / máquina',  'Espalda media',         120.00, 5),
    ('chest-press',    'Press de pecho en máquina',        'Pecho / Tríceps',       120.00, 6)
on conflict (slug) do nothing;

insert into public.seasons (title, prize_amount_cop, start_date, end_date, is_active)
select 'Temporada Piloto', 100000.00, current_date, current_date + 30, true
where not exists (select 1 from public.seasons where is_active);
