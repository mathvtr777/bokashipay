"use client";
import { motion } from "framer-motion";

const passos = [
  {
    n: 1,
    title: "Crie sua conta",
    text: "Cadastro em menos de 1 minuto. Sem KYC pra começar.",
  },
  {
    n: 2,
    title: "Conecte seu bot ou link",
    text: "Integra com Telegram, WhatsApp ou checkout próprio em poucos cliques.",
  },
  {
    n: 3,
    title: "Receba PIX e saque",
    text: "Vendas confirmadas na hora, saque facilitado pra sua conta.",
  },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Comece a vender{" "}
            <span className="gradient-text">hoje.</span>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {passos.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="relative rounded-2xl border border-bp-line bg-bp-panel/60 p-6"
            >
              <div className="absolute -top-4 left-6 grid h-8 w-8 place-items-center rounded-full bg-bp-500 font-display text-sm font-bold text-white shadow-lg shadow-bp-500/40">
                {p.n}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-bp-mist/70">{p.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Placeholder pra imagem ilustrativa dos 3 passos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="placeholder-img mx-auto mt-12 aspect-[16/7] w-full max-w-4xl"
          aria-label="Imagem ilustrativa dos 3 passos — substituir"
        >
          <span>📐 placeholder — imagem dos 3 passos</span>
        </motion.div>
      </div>
    </section>
  );
}