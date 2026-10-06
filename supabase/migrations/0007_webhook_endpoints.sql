-- ============================================================================
-- BokashiPay — migration 0007
--
-- Webhooks de saída: URL que o merchant cadastra pra receber notificações
-- quando algo acontece (ex: charge.paid). A Bokashi dispara POST com
-- payload assinado (HMAC-SHA256 do corpo, header X-Bokashi-Signature).
-- ============================================================================

create table if not exists public.webhook_endpoints (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  url               text not null,
  secret            text not null,
  events            text[] not null default '{charge.paid}',
  active            boolean not null default true,
  last_delivery_at  timestamptz,
  last_status       smallint,
  last_error        text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_webhook_endpoints_user on public.webhook_endpoints (user_id);

alter table public.webhook_endpoints enable row level security;

drop policy if exists "webhook_endpoints_all" on public.webhook_endpoints;
create policy "webhook_endpoints_all" on public.webhook_endpoints
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));