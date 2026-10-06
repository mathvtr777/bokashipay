-- ============================================================================
-- BokashiPay — schema inicial
-- Rode este arquivo inteiro no Supabase SQL Editor (ou via CLI).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. Função auxiliar
-- ============================================================================

-- SECURITY DEFINER para permitir que o trigger de criação de perfil
-- insira em `public` mesmo quando o usuário ainda não tem sessão.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- 2. Tabelas
-- ============================================================================

-- Perfis (1:1 com auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  phone         text,
  document      text,                       -- CPF ou CNPJ
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Clientes do merchant
create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  email         text,
  phone         text,
  document      text,
  status        text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Transações de venda (fonte de verdade para o dashboard)
create table if not exists public.transactions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  customer_id           uuid references public.customers (id) on delete set null,
  amount                numeric(14,2) not null check (amount >= 0),
  fee                   numeric(14,2) not null default 0 check (fee >= 0),
  net_amount            numeric(14,2) not null check (net_amount >= 0),
  method                text not null check (method in ('pix', 'card', 'boleto')),
  status                text not null default 'pending'
                          check (status in ('approved', 'pending', 'canceled', 'refunded')),
  external_id           text,               -- id do provedor de pagamento
  description           text,
  -- interested_party: quem pagou (nome/cpf) quando informado pelo PSP
  payer_name            text,
  payer_document        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Cobranças PIX
create table if not exists public.pix_transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  transaction_id    uuid references public.transactions (id) on delete set null,
  amount            numeric(14,2) not null check (amount > 0),
  status            text not null default 'pending'
                      check (status in ('pending', 'paid', 'expired', 'canceled')),
  -- provider_request_id: identificador devolvido pelo PSP. NULL = ainda não emitido.
  provider_request_id text,
  qr_code_base64    text,
  copy_paste_code   text,
  expires_at        timestamptz,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Contas bancárias do usuário
create table if not exists public.bank_accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  bank_code     text not null,
  bank_name     text not null,
  agency        text not null,
  account       text not null,
  account_digit text,
  account_type  text not null default 'checking'
                  check (account_type in ('checking', 'savings')),
  holder_name   text not null,
  holder_document text,
  pix_key       text,
  is_primary    boolean not null default false,
  status        text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Saques em cripto
create table if not exists public.crypto_withdrawals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  amount_brl          numeric(14,2) not null check (amount_brl > 0),
  amount_crypto       numeric(24,8),
  crypto_currency    text not null default 'USDT',
  network             text not null check (network in ('TRC20', 'ERC20', 'BEP20')),
  wallet_address      text not null,
  rate_used           numeric(18,8),
  status              text not null default 'pending'
                        check (status in ('pending', 'processing', 'completed', 'rejected')),
  -- provider_withdrawal_id: preenchido só quando um provedor executa a transferência
  provider_withdrawal_id text,
  tx_hash             text,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- Extrato financeiro (livro-razão do usuário)
create table if not exists public.financial_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  transaction_id  uuid references public.transactions (id) on delete set null,
  withdrawal_id   uuid references public.crypto_withdrawals (id) on delete set null,
  type            text not null
                    check (type in ('income', 'expense', 'fee', 'refund', 'withdrawal')),
  description     text not null,
  amount          numeric(14,2) not null,
  -- balance_after: saldo do usuário imediatamente após esta entrada
  balance_after   numeric(14,2) not null,
  created_at      timestamptz not null default now()
);

-- Credenciais de integrações.
-- IMPORTANTE: api_token nunca é devolvido ao cliente. O frontend lê apenas
-- `connected`, `external_id` e timestamps via view segura / colunas permitidas.
create table if not exists public.integrations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  provider      text not null check (provider in ('utmfy')),
  external_id   text,
  api_token     text,
  webhook_url   text,
  connected     boolean not null default false,
  last_tested_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, provider)
);

-- Eventos recebidos de integrações
create table if not exists public.integration_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  integration_id  uuid references public.integrations (id) on delete cascade,
  event           text not null,
  payload         jsonb,
  status          text not null default 'received'
                    check (status in ('received', 'processed', 'ignored', 'failed')),
  error_message   text,
  created_at      timestamptz not null default now()
);

-- Notificações
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  body        text,
  type        text not null default 'info'
                check (type in ('info', 'payment', 'pix', 'withdrawal', 'sale', 'error')),
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Banners do carrossel (editáveis pelo admin, servidos via Realtime)
create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  cta_label   text,
  cta_href    text,
  image_url   text,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Configurações por usuário
create table if not exists public.settings (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  -- Preferências de notificação
  notify_payment      boolean not null default true,
  notify_pix          boolean not null default true,
  notify_withdrawal   boolean not null default true,
  notify_sale         boolean not null default true,
  notify_email        boolean not null default true,
  -- Preferências de UI
  theme               text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================================
-- 3. Índices
-- ============================================================================

create index if not exists idx_customers_user            on public.customers (user_id);
create index if not exists idx_customers_user_created    on public.customers (user_id, created_at desc);

create index if not exists idx_transactions_user          on public.transactions (user_id);
create index if not exists idx_transactions_user_date     on public.transactions (user_id, created_at desc);
create index if not exists idx_transactions_user_status   on public.transactions (user_id, status);
create index if not exists idx_transactions_user_method   on public.transactions (user_id, method);
-- Garante no máximo um PIX aberto por transação (idempotência do PSP)
create unique index if not exists idx_pix_one_open_per_tx
  on public.pix_transactions (transaction_id)
  where status = 'pending';

create index if not exists idx_pix_user_date              on public.pix_transactions (user_id, created_at desc);
create index if not exists idx_pix_external_id            on public.pix_transactions (provider_request_id)
  where provider_request_id is not null;

create index if not exists idx_bank_accounts_user         on public.bank_accounts (user_id);
-- Só uma conta principal por usuário
create unique index if not exists idx_bank_accounts_primary
  on public.bank_accounts (user_id) where is_primary;

create index if not exists idx_crypto_withdrawals_user    on public.crypto_withdrawals (user_id, created_at desc);
create index if not exists idx_crypto_withdrawals_status  on public.crypto_withdrawals (user_id, status);

create index if not exists idx_financial_entries_user     on public.financial_entries (user_id, created_at desc);
create index if not exists idx_financial_entries_type     on public.financial_entries (user_id, type);

create index if not exists idx_integrations_user          on public.integrations (user_id);
create index if not exists idx_integration_events_user    on public.integration_events (user_id, created_at desc);

create index if not exists idx_notifications_user         on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread       on public.notifications (user_id) where read = false;

create index if not exists idx_banners_active             on public.banners (active, sort_order);

-- ============================================================================
-- 4. updated_at automático
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','customers','transactions','pix_transactions',
                          'bank_accounts','crypto_withdrawals','integrations','settings']
  loop
    execute format(
      'drop trigger if exists trg_touch_%1$s on public.%1$I;', t, t);
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$I
         for each row execute function public.touch_updated_at();', t, t);
  end loop;
end;
$$;

-- ============================================================================
-- 5. Row Level Security — isolamento por usuário
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.customers          enable row level security;
alter table public.transactions       enable row level security;
alter table public.pix_transactions   enable row level security;
alter table public.bank_accounts      enable row level security;
alter table public.crypto_withdrawals enable row level security;
alter table public.financial_entries  enable row level security;
alter table public.integrations       enable row level security;
alter table public.integration_events enable row level security;
alter table public.notifications      enable row level security;
alter table public.banners            enable row level security;
alter table public.settings           enable row level security;

-- Helper: o usuário autenticado é o dono do registro?
create or replace function public.is_owner(row_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and auth.uid() = row_user_id;
$$;

-- profiles: a coluna id É o user_id, então a política usa o id da própria linha.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Tabelas com user_id: mesma política, uma por tabela.
do $$
declare t text;
begin
  foreach t in array array['customers','transactions','pix_transactions','bank_accounts',
                          'crypto_withdrawals','financial_entries','integration_events',
                          'notifications']
  loop
    execute format('drop policy if exists "%1$s_all" on public.%1$I', t, t);
    execute format(
      'create policy "%1$s_all" on public.%1$I
         for all using (public.is_owner(user_id)) with check (public.is_owner(user_id))', t, t);
  end loop;
end;
$$;

-- integrations: política separada porque o token exige tratamento especial.
drop policy if exists "integrations_select" on public.integrations;
create policy "integrations_select" on public.integrations
  for select using (public.is_owner(user_id));

drop policy if exists "integrations_insert" on public.integrations;
create policy "integrations_insert" on public.integrations
  for insert with check (public.is_owner(user_id));

drop policy if exists "integrations_update" on public.integrations;
create policy "integrations_update" on public.integrations
  for update using (public.is_owner(user_id)) with check (public.is_owner(user_id));

drop policy if exists "integrations_delete" on public.integrations;
create policy "integrations_delete" on public.integrations
  for delete using (public.is_owner(user_id));

-- settings: chave primária é user_id
drop policy if exists "settings_all" on public.settings;
create policy "settings_all" on public.settings
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));

-- banners: tabela global. Todos autenticados leem; escrita só via service role.
drop policy if exists "banners_read" on public.banners;
create policy "banners_read" on public.banners
  for select using (auth.role() = 'authenticated');

-- ============================================================================
-- 6. Trigger de criação de perfil
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 7. View segura de integrações
-- ============================================================================
-- Nunca expõe api_token. O frontend consome esta view.

create or replace view public.integrations_safe
with (security_invoker = on)
as
select
  id,
  user_id,
  provider,
  external_id,
  webhook_url,
  connected,
  last_tested_at,
  created_at,
  updated_at
from public.integrations;

grant select on public.integrations_safe to authenticated;

-- ============================================================================
-- 8. Realtime
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array['transactions','pix_transactions','crypto_withdrawals',
                          'notifications','financial_entries']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end;
$$;