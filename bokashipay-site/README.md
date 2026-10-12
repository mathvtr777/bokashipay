# BokashiPay — Landing Page

Landing completa da BokashiPay, construída com **Next.js 14 + Tailwind + Framer Motion**, paleta **roxa, preta e branca**.

## 🚀 Como rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:3000

Para build de produção:
```bash
npm run build
npm start
```

## 🗂️ Estrutura

```
app/
  layout.tsx       # layout raiz + fontes (Inter, Sora)
  page.tsx         # página principal (monta as seções)
  globals.css      # estilos globais + classes utilitárias
components/
  Header.tsx       # topo fixo com menu + barra de atenção
  Hero.tsx         # seção principal com headline e CTA
  NotebookAnimation.tsx  # 🎯 notebook com dashboard animando
  Marquee.tsx      # faixa de palavras rolando
  ParaQuemE.tsx    # seção "Para quem é"
  Ferramentas.tsx  # cards das ferramentas
  ComoFunciona.tsx # 3 passos numerados
  Diferenciais.tsx # bullet list + imagem
  Precos.tsx       # comparativo de taxas
  MaisControle.tsx # grid de 9 ferramentas
  FAQ.tsx          # accordion de perguntas
  CtaFinal.tsx     # CTA final
  Footer.tsx       # rodapé
tailwind.config.ts # paleta personalizada (bp-50 a bp-900, bp-ink, bp-mist)
```

## 🎨 Paleta de cores

Definida em `tailwind.config.ts` como `bp-*`:

- **Roxo principal:** `bp-500` = `#7a3aff`
- **Roxo claro → escuro:** `bp-50` ... `bp-900`
- **Pretos:** `bp-ink` (#0a0612), `bp-panel` (#110a1f), `bp-line` (#1f1432)
- **Brancos:** `bp-mist` (#f4f1ff), `bp-snow` (#ffffff)

Gradiente de texto com `gradient-text` (roxo claro → médio → escuro).

## 🎬 Animações

Feitas com **Framer Motion**:
- `fade-up` no scroll (entrada suave de cada seção)
- `marquee` infinita de palavras
- `pulse-glow` em CTAs
- **Notebook com dashboard animando**: números (saldo, vendas, aprovação) incrementam com `easeOutCubic` ao entrar na viewport, sparkline com barras crescendo, e loop contínuo a cada 4s. Localiza em `components/NotebookAnimation.tsx`.

## 🖼️ Onde colocar as imagens

Tem **6 espaços reservados** pra imagens marcados visualmente com `📐 placeholder`. Substitua os `<motion.div className="placeholder-img …">` por `<Image src="…" />` quando tiver as imagens.

Locais:
1. `ComoFunciona.tsx` — imagem dos 3 passos
2. `Diferenciais.tsx` — dashboard / produto
3. `MaisControle.tsx` — mockup "Mais controle"
4. `CtaFinal.tsx` — mockup final
5. (e opcionalmente o logo/mascote no Hero)

Salve as imagens em `public/images/` e importe com `next/image`.

## ✏️ Textos

Todos os textos estão inline nos componentes. A copy segue o mesmo tom e estrutura da Laranjinha (foco em PIX, taxa baixa, sem KYC, ferramentas de venda). Adaptei pra identidade BokashiPay — revise com calma o que não bater com o que vocês comunicam oficialmente.

## 📞 Suporte / WhatsApp

Os links de WhatsApp ainda estão como `href="#"`. Substitua pelo número real nos componentes:
- `Header.tsx` (barra de atenção)
- `ParaQuemE.tsx` (card "escalar")
- `Hero.tsx`, `CtaFinal.tsx` (CTA especialista)

---

BokashiPay © 2026
