-- ============================================================================
-- BokashiPay — migration 0010
--
-- Telegram Bots: stores user's connected bots, automation flows, and execution logs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Table: telegram_bots
-- Stores bot tokens and metadata. The token is stored encrypted; the plaintext
-- is never persisted in plain text. Only the SHA-256 hash is stored for
-- ownership checks. Encryption key should be set via TELEGRAM_BOT_TOKEN_KEY env.
-- ---------------------------------------------------------------------------
create table if not exists public.telegram_bots (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  bot_username    text,                             -- Telegram @username
  bot_id          bigint,                           -- Telegram's internal bot ID
  token_hash      text not null,                    -- SHA-256 hash of the token
  token_encrypted text,                             -- Encrypted token for API calls
  status          text not null default 'pending'
    check (status in ('pending','active','inactive','error')),
  error_message   text,
  webhook_url     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_telegram_bots_user on public.telegram_bots (user_id);
create index if not exists idx_telegram_bots_status on public.telegram_bots (user_id, status);

alter table public.telegram_bots enable row level security;

drop policy if exists "telegram_bots_all" on public.telegram_bots;
create policy "telegram_bots_all" on public.telegram_bots
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));

-- ---------------------------------------------------------------------------
-- Table: telegram_flows
-- Automation flows: name, description, steps (JSON), and active flag.
-- ---------------------------------------------------------------------------
create table if not exists public.telegram_flows (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  bot_id          uuid references public.telegram_bots (id) on delete set null,
  name            text not null,
  description     text,
  steps           jsonb not null default '[]',         -- Array of FlowStep
  active          boolean not null default false,
  trigger_type    text not null default 'keyword'
    check (trigger_type in ('keyword','command','button','payment')),
  trigger_value  text,                               -- Keyword or command string
  template_id     text,                               -- If created from a template
  runs_count      integer not null default 0,
  last_run_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_telegram_flows_user on public.telegram_flows (user_id);
create index if not exists idx_telegram_flows_bot on public.telegram_flows (bot_id);
create index if not exists idx_telegram_flows_active on public.telegram_flows (user_id, active);

alter table public.telegram_flows enable row level security;

drop policy if exists "telegram_flows_all" on public.telegram_flows;
create policy "telegram_flows_all" on public.telegram_flows
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));

-- ---------------------------------------------------------------------------
-- Table: telegram_flow_runs
-- Execution log for debugging and analytics.
-- ---------------------------------------------------------------------------
create table if not exists public.telegram_flow_runs (
  id              uuid primary key default gen_random_uuid(),
  flow_id         uuid not null references public.telegram_flows (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  trigger_message text,                               -- Message that triggered the flow
  user_telegram_id bigint,                           -- Telegram user ID who triggered
  user_first_name text,                              -- Telegram user's first name
  response_sent   text,                              -- Bot's response (truncated)
  status          text not null default 'success'
    check (status in ('success','error','skipped')),
  error_message   text,
  execution_ms    integer,                            -- Execution time in ms
  created_at      timestamptz not null default now()
);

create index if not exists idx_telegram_flow_runs_flow on public.telegram_flow_runs (flow_id);
create index if not exists idx_telegram_flow_runs_created on public.telegram_flow_runs (created_at desc);

-- ---------------------------------------------------------------------------
-- Trigger to update updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger telegram_bots_updated_at
  before update on public.telegram_bots
  for each row execute function public.touch_updated_at();

create trigger telegram_flows_updated_at
  before update on public.telegram_flows
  for each row execute function public.touch_updated_at();
