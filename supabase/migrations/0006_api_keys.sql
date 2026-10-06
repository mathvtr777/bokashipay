-- ============================================================================
-- BokashiPay — migration 0006
--
-- Tabela de API keys. Cada merchant pode gerar várias (rotacionar, ambiente
-- dev vs prod, integrações diferentes). A chave completa NUNCA é gravada —
-- só o hash bcrypt. A UI mostra a chave UMA VEZ no momento da criação, e
-- depois só o prefixo + últimos 4 são visíveis.
--
-- Formato da chave: bok_live_<prefix>_<random>
-- ============================================================================

create table if not exists public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  prefix        text not null,
  key_hash      text not null,
  suffix        text not null,
  last_used_at  timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create unique index if not exists idx_api_keys_hash on public.api_keys (key_hash);
create index if not exists idx_api_keys_user on public.api_keys (user_id);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_all" on public.api_keys;
create policy "api_keys_all" on public.api_keys
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));