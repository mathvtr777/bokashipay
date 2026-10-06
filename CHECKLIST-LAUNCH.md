# Checklist de lançamento — BokashiPay

Verificado em 05/10/2026 contra o projeto real. Cada item está no estado em que
foi encontrado, não em teoria.

---

## 🔴 Bloqueadores — resolva antes de abrir ao público

### 1. Qualquer pessoa pode criar conta com qualquer e-mail

**Estado:** `mailer_autoconfirm: true` e `disable_signup: false`.

Hoje, se alguém digitar `seunome@qualquercoisa.com` no `/register`, a conta é
criada e já entra no dashboard. Sem verificação de e-mail. Isso não é um detalhe:
é qualquer conta entrando pela porta da frente.

Em produção você quer o contrário dos dois:

- **Auth → Sign In / Providers → Email** → desmarque **Confirm email**
- **Auth → Sign In / Providers → Email** → mantenha **Enable email signup**
  ligado (você quer receber cadastro, só não sem verificação)

### 2. `SUPABASE_SECRET_KEY` vazia

**Estado:** preenchida ✅ (verificada contra a API: 200 com RLS contornado).

Sem ela, três coisas quebram ao mesmo tempo, cada uma com erro diferente:

| O que quebra | Como aparece |
|---|---|
| Webhook da Pushin Pay | Retorna 500 e **nenhum pagamento é confirmado** |
| Notificações | Não gravam (aparece um aviso no log) |
| Fila do `/admin/saques` | Carrega vazia, sem avisar que falta |

Dashboard → Project Settings → API Keys → copie a **secret key** (a `sb_secret_…`,
não a publishable).

### 3. `PUSHINPAY_PUBLIC_URL` vazia

**Estado:** vazia — **confirmado como causa raiz da confirmação que não funciona.**

A Pushin Pay respondeu ao seu webhook com:

> `"http_error": "O domínio da url está na lista de bloqueio para webhooks."`

Não é apenas inacessível: localhost está explicitamente bloqueado pela Pushin
Pay. Domínio com HTTPS não é recomendação, é requisito.

Sem URL pública, **nenhum pagamento é confirmado automaticamente**. Foi
exatamente o que aconteceu no seu teste de R$ 0,50: a cobrança foi criada e paga
certo, mas a Pushin Pay não tinha como avisar.

Em produção: `PUSHINPAY_PUBLIC_URL=https://seudominio.com.br`
(HTTPS obrigatório — o provedor não chama HTTP.)

Em desenvolvimento local, a Pushin Pay não alcança `localhost`. Se precisar
testar antes do domínio, use `ngrok http 3000` e aponte a variável para a URL
temporária.

### 4. Webhook sem autenticação

**Estado:** `PUSHINPAY_WEBHOOK_SECRET` vazia.

O webhook aceita qualquer chamada. Alguém que descubrisse a URL poderia
**marcar uma cobrança como paga sem ter pago**. Isso é perda direta de dinheiro.

1. Painel Pushin Pay → Configurações → **header customizado** de webhook
2. Defina um valor aleatório longo, anote como `PUSHINPAY_WEBHOOK_SECRET`
3. A rota passa a exigir `x-pushinpay-signature` com HMAC-SHA256 do corpo

---

## 🟡 Importantes — não quebram o lançamento, mas custam depois

### 5. E-mail de recuperação não vai funcionar

O Supabase usa SMTP próprio por padrão: **limitado a ~2–3 e-mails por hora e
só para membros da equipe**. Quando um usuário esquecer a senha, o e-mail não sai.

Configurar SMTP real (Resend, Postmark, AWS SES) em Auth → Email → SMTP.
Grátis em Resend para começar.

### 6. Sem limite de tentativas no login

Não existe rate limit no `/api/auth/login`. Senha curta e comum + script =
força bruta sem freio.

Antes do lançamento: rate limit por IP no login e na criação de PIX. Na Vercel,
`/api/auth/login` passa por WAF rules.

### 7. Pushin Pay exige aviso ao consumidor (risco de bloqueio)

O item 4.10 dos Termos de Uso deles exige que o **vendedor** deixe isso
visível **antes da finalização do pagamento**:

> A PUSHIN PAY atua exclusivamente como processadora de pagamentos e não possui
> qualquer responsabilidade pela entrega, suporte, conteúdo, qualidade ou
> cumprimento das obrigações relacionadas aos produtos ou serviços oferecidos
> pelo vendedor.

O texto tem que aparecer no checkout, antes do pagamento. Não cumprir pode gerar
penalização **e bloqueio da conta** — ou seja, sua conta perde a maquininha.

---

## 🟢 Antes de anunciar

- [ ] Migration `0002_withdrawal_requests.sql` aplicada — **já está**
- [ ] Testar um PIX de R$ 0,50 de ponta a ponta: gerar → pagar → confirmar
      automático → status muda para **Pago** sem clicar em "Atualizar"
- [ ] Confirmar que a linha entrou no extrato com saldo atualizado
- [ ] Testar recuperação de senha com o SMTP configurado
- [ ] Criar uma conta nova e percorrer todas as páginas sem erro no console
- [ ] Cadastrar uma conta bancária real (a Pushin Pay exige para repassar)
- [ ] Definir as taxas (`src/services/payments/rules.ts` — hoje: PIX 0,99%,
      cartão 3,49%) e conferir com seu contrato
- [ ] Subir `npm run build` e rodar em produção (`npm start`), não `npm run dev`

---

## Resumo do que está travando agora

| Prioridade | Item | Você faz |
|---|---|---|
| 🔴 | Desligar auto-confirm de e-mail | Painel Supabase |
| 🔴 | Preencher `SUPABASE_SECRET_KEY` | `.env.local` |
| 🔴 | Preencher `PUSHINPAY_PUBLIC_URL` | `.env.local` |
| 🔴 | Configurar `PUSHINPAY_WEBHOOK_SECRET` | Painel Pushin Pay |
| 🟡 | SMTP para recuperação de senha | Painel Supabase |
| 🟡 | Rate limit no login | Sua implantação |
| 🟡 | Texto legal da Pushin Pay no checkout | Tela de cobrança |