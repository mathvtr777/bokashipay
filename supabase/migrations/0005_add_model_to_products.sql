-- ============================================================================
-- BokashiPay — migration 0005
--
-- Adiciona a coluna `model` em products pra distinguir venda única
-- (one_time) de assinatura (subscription).
--
-- Por enquanto, assinatura é só um flag — o checkout gera uma cobrança PIX
-- avulsa igual venda única. Quando a Pushin Pay (ou outro PSP) expor
-- Pix Automático/Pix Recorrente, a UI do checkout evolui pra fazer a
-- primeira autorização recorrente.
-- ============================================================================

alter table public.products
  add column if not exists model text not null default 'one_time'
    check (model in ('one_time', 'subscription'));