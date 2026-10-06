# BokashiPay

Plataforma de pagamentos com dashboard administrativo: PIX, vendas, financeiro,
contas bancárias, saques em cripto e integrações.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase

---

## ⚠️ Antes de rodar: aplicar a migration

**O banco está vazio.** As tabelas, políticas de RLS, índices e triggers ainda
não existem no projeto Supabase — nenhuma das telas funciona até isso.

A chave que acompanha o projeto é a *publishable key*, que por design **não
executa DDL**. A aplicação da migration precisa ser feita por você:

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) → projeto
   `anapagpjwljzpbwjerng` → **SQL Editor** → **New query**
2. Cole o conteúdo inteiro de `supabase/migrations/0001_initial_schema.sql`
3. Clique em **Run**

O arquivo é idempotente: pode ser executado mais de uma vez sem quebrar nada.

Depois disso, `supabase/migrations/` e `src/lib/database.types.ts` precisam
continuar em sincronia. Se alterar o schema, regenere os tipos:

```bash
npx supabase gen types typescript --project-id anapagpjwljzpbwjerng > src/lib/database.types.ts
```

---

## Instalação

```bash
npm install
cp .env.example .env.local   # e preencha SUPABASE_SECRET_KEY
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Onde vive | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | frontend + servidor | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | frontend + servidor | Autenticação e consultas com RLS |
| `SUPABASE_SECRET_KEY` | **só servidor** | Webhooks, credenciais de integração, tarefas de sistema |
| `PUSHINPAY_API_URL` / `PUSHINPAY_API_TOKEN` | só servidor | Emissão e consulta de cobrança PIX |
| `PUSHINPAY_WEBHOOK_SECRET` | só servidor | Assinatura HMAC do webhook de pagamento |
| `PUSHINPAY_PUBLIC_URL` | só servidor | URL pública para o provedor chamar o webhook |
| `ADMIN_USER_EMAILS` | só servidor | Quem pode aprovar saques em `/admin/saques` |
| `UTMFY_API_URL` / `UTMFY_API_KEY` / `UTMFY_WEBHOOK_SECRET` | só servidor | Integração UTMFY |

`SUPABASE_SECRET_KEY` fica em Dashboard → Project Settings → API Keys.
Enquanto ela estiver vazia, webhooks e gravação de token de integração
retornam erro em vez de falhar em silêncio.

---

## Saques: aprovação manual

A Pushin Pay é usada **só para receber**. Saques saem por decisão humana.

O fluxo tem três estados deliberadamente separados:

```
Usuário solicita  →  pending      (ninguém decide nada ainda)
Admin aprova      →  approved     (decidido que será pago)
Admin confirma    →  completed    (o dinheiro foi transferido)
```

`solicitou` e `foi pago` não são o mesmo evento, então não são o mesmo estado.
Um pedido nunca pula de `pending` para `completed`: a API rejeita a transição
(`409`), o que impede que um duplo clique marque como pago o que ninguém aprovou.

**Nada é pago automaticamente.** O painel não envia PIX — você paga pelo banco e
marca "Confirmar pagamento". O extrato do usuário só registra a saída quando o
saque é concluído, e o saldo só cai em `completed`.

Aprovação e recusa enviam notificação ao usuário. A recusa pede um motivo, que
aparece para ele. Toda decisão fica registrada em `admin_actions`.

### Quem acessa

`ADMIN_USER_EMAILS` no servidor, separado por vírgula. A checagem acontece na
página e **de novo na API** — o cliente nunca decide. O item "Aprovar saques"
só aparece na sidebar de administradores.

Trocar a lista exige reiniciar o servidor, porque a variável é lida no boot.

### Por que a chave PIX aparece inteira no painel

Para executar o pagamento, o painel precisa da chave. É a rota mais sensível do
sistema, e é por isso que ela exige `ADMIN_USER_EMAILS` no servidor em vez de um
papel gravado no banco. A rota usa service role porque o RLS normal esconde as
solicitações dos outros usuários — juntar as de todos é justamente o trabalho
desse painel.

---

## Adquirente: Pushin Pay

O PIX está ligado à Pushin Pay. Contrato usado na implementação:

| Operação | Requisição |
|---|---|
| Criar cobrança | `POST {PUSHINPAY_API_URL}/pix/cashIn` — `{ "value": <centavos>, "webhook_url"? }` |
| Consultar status | `GET {PUSHINPAY_API_URL}/transaction/{id}` |
| Autenticação | `Authorization: Bearer <token>` |

Pontos do contrato que a implementação respeita:

- **`value` é sempre em centavos**, com mínimo de R$ 0,50. A conversão
  acontece em um único lugar e é validada no servidor e no formulário.
- **`qr_code_base64` já vem como data URL** (`data:image/png;base64,...`).
  O prefixo é removido antes de gravar, porque o resto do produto assume base64 puro.
- **Status**: `created` → `pending`, `paid` → `paid`, `canceled`/`expired`
  → iguais. Qualquer estado desconhecido cai em `pending` — um status não
  reconhecido nunca é lido como pago.
- **Valor mínimo de 50 centavos** é rejeitado antes da chamada, evitando um 422.

### Webhook de pagamento

A cobrança é criada com `webhook_url` apontando para
`/api/webhooks/pushinpay`. Sem ela a Pushin Pay não avisa quando o PIX é pago.

O webhook é o caminho pelo qual um pagamento vira `paid` sozinho: espelha o
status em `pix_transactions` e em `transactions`, grava a entrada no extrato e
cria a notificação. É idempotente — o provedor reenvia até 3 vezes e o segundo
envio não duplica lançamento nem notificação.

A cobrança é localizada pelo `id` devolvido pela Pushin Pay, e o `user_id` vem
do registro encontrado — nunca do payload.

> **Atenção:** sem `PUSHINPAY_WEBHOOK_SECRET` configurado, o webhook aceita
> qualquer chamada. Alguém que descubrisse a URL poderia marcar uma cobrança
> como paga. Configure o header customizado no painel da Pushin Pay.

---

## Integrações: o que é real e o que não é

Este projeto **não simula pagamentos, saques ou transferências**. Um QR Code
gerado localmente não cobra ninguém, e um saque marcado como concluído sem um
provedor de verdade seria uma mentira para o usuário.

Sem provedor configurado, a interface mostra **"Integração não configurada"** e
o registro fica com status `pending`. Só dois caminhos alteram status para
confirmado:

- o **webhook** da Pushin Pay, que grava `paid` quando o provedor notifica;
- `POST /api/pix/status`, que consulta o status no PSP sob demanda e só então
  grava `paid`.

A Pushin Pay tem um endpoint `GET /cashOut` para saque PIX, mas ele não é usado:
a decisão de pagar é sua, e a execução é feita por fora do sistema.

Os adaptadores ficam em `src/services/{pix,crypto,utmfy}/`. Para plugar um
provedor real, implemente a interface (`PixProvider`, `CryptoProvider`) ou ajuste
as chamadas HTTP — o resto do produto não muda.

| Integração | Estado | O que falta |
|---|---|---|
| Autenticação | ✅ Funcional | — |
| Banco + RLS | ✅ Funcional | Aplicar a migration |
| Vendas / Financeiro / Clientes | ✅ Funcional | — |
| PIX | ✅ Pushin Pay | `PUSHINPAY_API_TOKEN` |
| Saques (PIX em reais) | ✅ Fluxo de aprovação | Aprovar em `/admin/saques` |
| UTMFY | Interface + webhook prontos | `UTMFY_API_URL` |

---

## Segurança

- **RLS em todas as tabelas.** Cada uma tem política por `user_id`, e a função
  `is_owner()` compara com `auth.uid()`. Um usuário não lê nem escreve dados de
  outro, mesmo que o frontend peça.
- **`user_id` sempre vem do token.** Nenhum `user_id` é aceito do corpo de uma
  requisição — as rotas usam o cliente do servidor, com o JWT da sessão.
- **Segredos fora do bundle.** `src/lib/supabase/admin.ts` importa
  `server-only`; puxá-lo para o cliente quebra o build em vez de vazar a chave.
- **Token da UTMFY nunca volta ao navegador.** O frontend lê a view
  `integrations_safe`, que não expõe `api_token`.
- **Webhook autenticado por HMAC** quando `UTMFY_WEBHOOK_SECRET` está definida,
  com comparação em tempo constante.
- **Validação dupla** (zod) no cliente e no servidor; CPF/CNPJ com dígito
  verificador de verdade.
- **Máscara de dados bancários** nas listagens — número de conta e documento
  nunca aparecem completos onde não são necessários.

---

## Estrutura

```
src/
├── app/
│   ├── (auth)/login, register, forgot-password, reset-password
│   ├── (app)/dashboard, vendas, pix, financeiro, clientes,
│   │         contas-bancarias, saques-cripto, integracoes,
│   │         configuracoes, perfil, ajuda
│   └── api/            ← rotas de servidor (operações sensíveis)
├── components/         ← ui, layout, e um diretório por área
├── lib/                ← supabase (client/server/admin), queries, tipos
├── services/           ← pix, crypto, utmfy, payments, notifications
└── proxy.ts            ← proteção de rotas e refresh de sessão
```

`proxy.ts` bloqueia rotas privadas e renova o access token. Isso é UX — a
autorização real está no RLS e vale mesmo que alguém force a URL.

---

## Testes

```bash
npx tsx tests/rules.test.ts      # taxas, saldos, conversão, métodos
npx tsx tests/pushinpay.test.ts  # centavos, data URL, status, erros do PSP
npx tsx tests/pix-key.test.ts    # classificação de chave PIX
npm run typecheck
npm run build
```

O que não é automatizado: a criação de uma cobrança real na Pushin Pay. O
script `scripts/e2e.ts` percorre as telas pelo navegador; o teste do provedor
exige uma transação de verdade e é feito manualmente.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |