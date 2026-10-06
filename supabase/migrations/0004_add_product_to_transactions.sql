-- ============================================================================
-- BokashiPay — migration 0004
--
-- Adiciona product_id em transactions. Necessário pra:
--   1. Vincular vendas ao produto de origem (merchant quer ver de qual
--      produto veio cada venda)
--   2. Social proof no checkout público ("X pessoas compraram esse produto")
--   3. Filtros futuros em /vendas por produto
--
-- `on delete set null` mantém o histórico de venda se o produto for excluído
-- (a transação fica órfã mas preserva o valor financeiro).
-- ============================================================================

alter table public.transactions
  add column if not exists product_id uuid
  references public.products (id) on delete set null;

create index if not exists idx_transactions_product
  on public.transactions (product_id, created_at desc)
  where product_id is not null;