-- ============================================================================
-- BokashiPay — migration 0003
--
-- Tabela de produtos do merchant. Cadastro simples: nome, slug, preço,
-- descrição, imagem, status. As configurações de checkout ficam em JSONB
-- (preparadas para Fase 2, sem uso ainda).
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  name               text not null,
  slug               text not null,
  description        text,
  price_cents        integer not null check (price_cents >= 0),
  image_url          text,
  status             text not null default 'draft'
                      check (status in ('draft', 'active', 'archived')),
  checkout_settings  jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Mesmo merchant não pode ter dois produtos com o mesmo slug. Mas
  -- merchants diferentes podem — o slug só identifica o produto dentro
  -- do namespace do próprio dono.
  unique (user_id, slug)
);

create index if not exists idx_products_user        on public.products (user_id);
create index if not exists idx_products_user_status on public.products (user_id, status);
create index if not exists idx_products_user_date   on public.products (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_products on public.products;
create trigger trg_touch_products
  before update on public.products
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.products enable row level security;

drop policy if exists "products_all" on public.products;
create policy "products_all" on public.products
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));