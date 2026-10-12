"use client";
import { motion } from "framer-motion";
import { Bot, Link2, MessageCircle, Zap } from "lucide-react";

const ferramentas = [
  {
    icon: Bot,
    title: "Bot de Telegram",
    text: "Receba pagamentos direto no Telegram, sem sair da conversa.",
  },
  {
    icon: Link2,
    title: "Link Privado",
    text: "Links de pagamento exclusivos pra cada cliente ou produto.",
  },
  {
    icon: MessageCircle,
    title: "Suporte no WhatsApp",
    text: "Atendimento humano que entende do seu negócio.",
  },
  {
    icon: Zap,
    title: "Gerar Pagamento Rápido",
    text: "PIX nominal em segundos, com confirmação na hora.",
  },
];

export default function Ferramentas() {
  return (
    <section id="ferramentas" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            O arsenal completo pra{" "}
            <span className="gradient-text">vender no automático</span>
          </h2>
          <p className="mt-4 text-bp-mist/70">
            Tudo o que você precisa pra escalar vendas, integrado numa só conta.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {ferramentas.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group rounded-2xl border border-bp-line bg-bp-panel/60 p-6 transition hover:border-bp-500/50 hover:bg-bp-panel"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-bp-500/15 text-bp-300 transition group-hover:bg-bp-500/25">
                <f.icon size={20} />
              </div>
              <h3 className="font-display text-lg font-semibold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-bp-mist/70">{f.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#" className="btn-primary">
            Quero vender no automático
          </a>
        </div>
      </div>
    </section>
  );
}