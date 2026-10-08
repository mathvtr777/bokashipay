-- ============================================================================
-- BokashiPay — migration 0009
--
-- Infrações (chargebacks / disputes / contestações do adquirente).
-- Cada infração pertence a uma transação do merchant e tem um ciclo de
-- status: `open` (recebida do PSP) → `analyzing` (em análise pelo Bokashi
-- ou pelo merchant) → `defended` (defendida com sucesso) ou `lost`
-- (perdida — o valor é descontado). `won` é reservado para o Bokashi
-- vencer a contestação sem cobrar defesa (raro).
--
-- Quando o Bokashi contestar automaticamente (anti-fraude), o campo
-- `defense_notes` registra o que foi argumentado.
-- ============================================================================

create table if not exists public.infracoes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  transaction_id  uuid references public.transactions (id) on delete set null,
  type            text not null default 'chargeback',
  status          text not null default 'open',
  amount          numeric(12,2) not null default 0,
  reason          text,
  defense_notes   text,
  opened_at       timestamptz not null default now(),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Tipos permitidos: chargeback, fraud, dispute.
  constraint infracoes_type_check check (type in ('chargeback', 'fraud', 'dispute')),
  -- Status permitidos: open, analyzing, defended, lost, won.
  constraint infracoes_status_check check (status in ('open', 'analyzing', 'defended', 'lost', 'won'))
);

create index if not exists idx_infracoes_user on public.infracoes (user_id);
create index if not exists idx_infracoes_tx on public.infracoes (transaction_id);
create index if not exists idx_infracoes_status on public.infracoes (user_id, status);
create index if not exists idx_infracoes_opened on public.infracoes (user_id, opened_at desc);

alter table public.infracoes enable row level security;

drop policy if exists "infracoes_all" on public.infracoes;
create policy "infracoes_all" on public.infracoes
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));

-- Trigger para manter updated_at coerente.
-- A função public.touch_updated_at() já foi criada em 0001.
drop trigger if exists trg_infracoes_touch on public.infracoes;
create trigger trg_infracoes_touch
  before update on public.infracoes
  for each row execute function public.touch_updated_at();
