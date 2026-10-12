# 📁 Pasta de imagens — BokashiPay

Coloque aqui as imagens que você quer usar na landing. Sugestão de nomenclatura:

- `hero-mascot.png` — mascote/logo do hero
- `dashboard.png` — print do dashboard real
- `passos.png` — imagem dos 3 passos
- `mockup-controle.png` — mockup "Mais controle"
- `mockup-final.png` — mockup final
- `logo-bokashipay.svg` — logo oficial em SVG
- `og-image.jpg` — Open Graph (1200x630)

Depois de subir, substitua os blocos `<motion.div className="placeholder-img">` por:

```tsx
import Image from "next/image";

<Image
  src="/images/dashboard.png"
  alt="Dashboard BokashiPay"
  width={1200}
  height={800}
  className="rounded-2xl border border-bp-line"
/>
```