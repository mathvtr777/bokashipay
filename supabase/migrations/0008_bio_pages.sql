-- ============================================================================
-- BokashiPay — migration 0008
--
-- Páginas de "Bio Link" (estilo Linktree) — uma por merchant, com slug
-- único que vira a URL pública `https://<DOMINIO>/u/<slug>`. O domínio é
-- fixo do sistema (configurado em runtime via env var, default
-- `pagueaqui.xyz`).
--
-- Cada merchant tem no máximo 10 páginas (limite enforced no client; a
-- RLS não precisa disso). O slug precisa ser único globalmente
-- (constraint `unique`) e respeita 3-52 chars: letras minúsculas, números,
-- `_` e `-`.
-- ============================================================================

create table if not exists public.bio_pages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  slug            text not null,
  display_name    text,
  bio             text,
  avatar_url      text,
  theme           text not null default 'orange', -- reservado para o sistema de Temas
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- slug global único: 3-52 chars, [a-z0-9_-]
  constraint bio_pages_slug_format check (slug ~ '^[a-z0-9_-]{3,52}$'),
  constraint bio_pages_slug_unique unique (slug)
);

create index if not exists idx_bio_pages_user on public.bio_pages (user_id);
create index if not exists idx_bio_pages_slug on public.bio_pages (slug);

alter table public.bio_pages enable row level security;

drop policy if exists "bio_pages_all" on public.bio_pages;
create policy "bio_pages_all" on public.bio_pages
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));

-- Trigger para manter updated_at coerente.
-- A função public.touch_updated_at() já foi criada em 0001.
drop trigger if exists trg_bio_pages_touch on public.bio_pages;
create trigger trg_bio_pages_touch
  before update on public.bio_pages
  for each row execute function public.touch_updated_at();
