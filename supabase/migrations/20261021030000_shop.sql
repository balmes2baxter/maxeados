-- =====================================================================
-- Maxeados · Tienda
-- Fichas que se ganan entrenando y accesorios premium para el personaje.
-- =====================================================================

create table public.shop_items (
    id varchar(40) primary key,          -- "<campo del avatar>:<valor>", p. ej. "headgear:corona"
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

create table public.purchases (
    user_id uuid not null references public.profiles(id) on delete cascade,
    item_id varchar(40) not null references public.shop_items(id),
    price int not null,
    created_at timestamptz not null default now(),
    primary key (user_id, item_id)
);

alter table public.shop_items enable row level security;
alter table public.purchases enable row level security;
create policy "shop_items: lectura" on public.shop_items for select to authenticated using (true);
create policy "purchases: ver propias" on public.purchases for select to authenticated using (user_id = auth.uid());
-- Sin políticas de insert: solo se compra con buy_item().

-- Fichas: 100 de bienvenida + 10 por intento enviado + 40 por intento aprobado − lo gastado
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
    -- Bloquea al usuario para que dos compras simultáneas no gasten el mismo saldo
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
