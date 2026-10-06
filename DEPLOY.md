# Implantar em bokashipay.site

Plataforma pronta. O que falta é o que só você pode fazer: comprar/apontar o
domínio e subir na hospedagem.

**Nada de VPS é necessário.** É um app Next.js; a Vercel roda de graça e emite
HTTPS sozinho.

---

## 1. Subir o código

O repositório já está inicializado e com o `.gitignore` correto (`.env` nunca
entra no git).

```bash
cd /home/bokashi/bokashipay
git commit -m "BokashiPay: dashboard, PIX via Pushin Pay, saques com aprovação manual"
```

Depois, crie um repositório vazio no GitHub e:

```bash
git remote add origin https://github.com/SEU-USUARIO/bokashipay.git
git branch -M main
git push -u origin main
```

## 2. Importar na Vercel

1. [vercel.com](https://vercel.com) → **Add New… → Project** → importe o repositório
2. Framework detectado: **Next.js** (não mexa)
3. **Environment Variables** — copie exatamente estas, todas em Production:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://anapagpjwljzpbwjerng.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable__4fgthaqcmLS_IkBqyZv-A_DobsivqA` |
| `SUPABASE_SECRET_KEY` | sua `sb_secret_…` |
| `PUSHINPAY_API_URL` | `https://api.pushinpay.com.br/api` |
| `PUSHINPAY_API_TOKEN` | seu token da Pushin Pay |
| `PUSHINPAY_PUBLIC_URL` | `https://bokashipay.site` |
| `PUSHINPAY_WEBHOOK_SECRET` | valor aleatório longo (veja passo 4) |
| `ADMIN_USER_EMAILS` | `waveagc@gmail.com` |
| `UTMFY_API_URL` | *(vazio por enquanto)* |
| `UTMFY_API_KEY` | *(vazio)* |
| `UTMFY_WEBHOOK_SECRET` | *(vazio)* |

4. Deploy.

## 3. Apontar o domínio

Na Vercel: **Settings → Domains → Add** → `bokashipay.site`.

A Vercel mostra os registros. No seu registrador, crie:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

O certificado HTTPS é emitido automaticamente em 1–2 minutos. Não precisa de
Let's Encrypt na mão.

## 4. Proteger o webhook (opcional, mas recomendado)

**Só depois** que o domínio responder em HTTPS.

A Pushin Pay envia em todos os webhooks um **header customizado de valor
estático** que você escolhe no painel. Não é assinatura HMAC — é um valor
combinado.

1. Painel Pushin Pay → **Configurações** → header customizado
2. Nome do header: `x-bokashipay-secret`
3. Valor: uma string longa e aleatória (`openssl rand -hex 32`)
4. Na Vercel, defina `PUSHINPAY_WEBHOOK_SECRET` com **o mesmo valor**

Se o nome não aparecer em Configurações e sim em outra aba, tudo bem: defina
também `PUSHINPAY_WEBHOOK_HEADER` na Vercel com o nome que você usou lá.

Sem isso o webhook aceita qualquer chamada — quem descobrir a URL marca
cobrança como paga sem pagar. O servidor registra um aviso no log a cada
requisição nesse caso.

## 5. Desligar o auto-confirm de e-mail

**Antes de divulgar a URL.** Com `mailer_autoconfirm` ligado, qualquer pessoa
cria conta com qualquer e-mail.

Painel Supabase → Authentication → Sign In / Providers → Email → **desmarque**
"Confirm email".

## 6. Conferir

```bash
npx tsx scripts/check-console.ts https://bokashipay.site/login
```

Depois, em `https://bokashipay.site`:

1. Faça login com `waveagc@gmail.com` → deve aparecer **"Aprovar saques"** na sidebar
2. Gere um PIX de R$ 0,50, **pague**, e espere 5–10 segundos
3. Sem clicar em nada, o status deve virar **Pago** sozinho — é o webhook chegando

Se ficar pendente: a Pushin Pay guarda a URL do webhook **por cobrança**, no
momento da criação. Cobranças antigas continuam apontando para o localhost e
não vão se corrigir retroativamente.

---

## O que ainda está pendente

| Item | Gravidade | Onde resolver |
|---|---|---|
| Auto-confirm de e-mail ligado | 🔴 qualquer um cria conta | Painel Supabase |
| `PUSHINPAY_WEBHOOK_SECRET` vazio | 🔴 aceita pagamento forjado | Painel Pushin Pay |
| SMTP não configurado | 🟡 recuperação de senha não sai | Painel Supabase |
| Sem rate limit no login | 🟡 força bruta | WAF da Vercel |
| Aviso legal da Pushin Pay | 🟡 risco de bloqueio da conta | Tela de cobrança |
| Taxas 0,99% / 3,49% são estimadas | 🟡 conferir com seu contrato | `src/services/payments/rules.ts` |

Detalhes em `CHECKLIST-LAUNCH.md`.

---

## Rollback

Cada deploy da Vercel tem "Promote to Production" para voltar à versão anterior
em um clique. Deployments com `Preview` não afetam o site real.

## Logs

Para ver erros de produção: Vercel → seu projeto → **Logs** → aba
**Runtime Logs**. O `[pix/status]` e o `[pix]` que escrevemos no servidor
aparecem lá — é por eles que se descobre por que um pagamento não confirmou.