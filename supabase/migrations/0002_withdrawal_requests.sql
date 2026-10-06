-- ============================================================================
-- BokashiPay — migration 0002
--
-- Saques passam a ser solicitações em reais, aprovadas manualmente pelo
-- administrador. A Pushin Pay fica só como meio de recebimento.
--
-- A tabela `crypto_withdrawals` da migration 0001 é substituída por
-- `withdrawal_requests`: manter os dois modelos criaria duas verdades sobre
-- "quanto dinheiro saiu". Ela era criada vazia e nunca populada.
--
-- A ordem importa: a FK de financial_entries precisa sair ANTES do DROP da
-- tabela, senão o Postgres recusa remover a tabela com objetos dependentes.
-- ============================================================================

-- 1. Solta a FK e a coluna que apontam para a tabela antiga.
alter table public.financial_entries
  drop column if exists withdrawal_id;

-- 2. Só agora a tabela pode sair.
drop table if exists public.crypto_withdrawals;

-- 3. A nova coluna aponta para a tabela nova (criada logo abaixo).
--    O ADD COLUMN REFERENCES exige que a tabela de destino já exista, então é
--    adicionado depois da criação.

-- -----------------------------------------------------------------------------
-- Solicitação de saque
-- -----------------------------------------------------------------------------

create table if not exists public.withdrawal_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  amount_brl    numeric(14,2) not null check (amount_brl > 0),

  -- Chave PIX de destino. A Pushin Pay recebe; o saque para fora é feito à mão
  -- pelo administrador.
  pix_key       text not null,
  pix_key_type  text not null check (pix_key_type in ('cpf', 'cnpj', 'email', 'phone', 'random')),
  holder_name   text not null,

  -- `pending` = aguardando o administrador. Dinheiro não sai do sistema até
  -- alguém aprovar explicitamente.
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'completed')),

  -- rastro da decisão: quem decidiu, quando, e por quê recusou
  reviewed_by       uuid references auth.users (id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  -- quando o admin marca como pago, guardamos a referência do pagamento
  payout_reference  text,
  completed_at      timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.financial_entries
  add column if not exists withdrawal_request_id uuid
  references public.withdrawal_requests (id) on delete set null;

create index if not exists idx_withdrawal_requests_user
  on public.withdrawal_requests (user_id, created_at desc);

-- A fila do administrador: pendentes primeiro, mais antigas no topo.
create index if not exists idx_withdrawal_requests_queue
  on public.withdrawal_requests (status, created_at desc)
  where status = 'pending';

alter table public.withdrawal_requests enable row level security;

drop policy if exists "withdrawal_requests_all" on public.withdrawal_requests;
create policy "withdrawal_requests_all" on public.withdrawal_requests
  for all using (public.is_owner(user_id)) with check (public.is_owner(user_id));

-- -----------------------------------------------------------------------------
-- Registro de decisões do administrador
--
-- Auditoria separada das solicitações: um pedido rejeitado pode ser
-- reaprovado depois, e o histórico precisa mostrar as duas decisões.
-- -----------------------------------------------------------------------------

create table if not exists public.admin_actions (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null references auth.users (id) on delete cascade,
  action        text not null
                  check (action in ('approve', 'reject', 'complete', 'cancel')),
  entity        text not null,
  entity_id     uuid not null,
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_admin_actions_entity
  on public.admin_actions (entity, entity_id, created_at desc);

-- Sem policy de usuário: ações administrativas são gravadas pelo service role,
-- e o acesso de leitura é restrito ao servidor (ver src/lib/admin.ts).

alter table public.admin_actions enable row level security;

-- -----------------------------------------------------------------------------
-- Realtime: a fila do admin precisa atualizar sem recarregar
-- -----------------------------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table public.withdrawal_requests;
  exception when duplicate_object then null;
  end;
end;
$$;