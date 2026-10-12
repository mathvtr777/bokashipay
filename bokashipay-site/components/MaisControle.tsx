"use client";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  LinkIcon,
  Plus,
  BarChart3,
  Users,
  Activity,
  Code2,
  Share2,
  Coins,
} from "lucide-react";

const items = [
  { icon: ShoppingCart, title: "Checkout", text: "Página de pagamento otimizada." },
  { icon: LinkIcon, title: "Bio Link", text: "Link na bio que vende 24h." },
  { icon: Plus, title: "Order bump", text: "Adicione produtos no checkout." },
  { icon: BarChart3, title: "Dashboard", text: "Métricas em tempo real." },
  { icon: Users, title: "Base de clientes", text: "Lista própria pra remarketing." },
  { icon: Activity, title: "Trackeamento", text: "Pixel e UTMs integrados." },
  { icon: Code2, title: "API & Webhooks", text: "Integra com qualquer sistema." },
  { icon: Share2, title: "Indicações", text: "Programa de afiliados nativo." },
  { icon: Coins, title: "Saque em cripto", text: "Receba em USDT se preferir." },
];

export default function MaisControle() {
  return (
    <section id="controle" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Tudo numa{" "}
            <span className="gradient-text">conta só.</span>
          </h2>
          <p className="mt-4 text-bp-mist/70">
            9 ferramentas essenciais pra você vender mais e ter controle total.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-start gap-4 rounded-2xl border border-bp-line bg-bp-panel/60 p-5 transition hover:border-bp-500/50"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-bp-500/15 text-bp-300">
                <it.icon size={18} />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white">
                  {it.title}
                </h3>
                <p className="mt-1 text-sm text-bp-mist/65">{it.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Placeholder pra imagem do mockup "Mais controle" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="placeholder-img mx-auto mt-12 aspect-[16/8] w-full max-w-5xl"
          aria-label="Mockup BokashiPay — substituir"
        >
          <span>📐 placeholder — mockup "Mais controle"</span>
        </motion.div>
      </div>
    </section>
  );
}