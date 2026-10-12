"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const passos = [
  {
    n: "01",
    title: "Crie sua conta grátis",
  },
  {
    n: "02",
    title: "Conecte seu bot ou crie um link",
  },
  {
    n: "03",
    title: "Receba PIX e saque na hora",
  },
];

export default function ThreeSteps() {
  return (
    <section id="three-steps" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Lado esquerdo: texto + passos numerados */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold md:text-5xl">
              Comece a vender{" "}
              <span className="gradient-text">hoje.</span>
            </h2>
            <p className="mt-4 text-bp-mist/70">
              Só e-mail e senha. Sem KYC, sem CPF, sem selfie. Em menos de 1
              minuto está pronto.
            </p>

            <ul className="mt-10 flex flex-col gap-3">
              {passos.map((p, i) => (
                <motion.li
                  key={p.n}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  className="flex items-center gap-4 rounded-full border border-bp-line bg-bp-ink/80 px-5 py-4"
                >
                  <span className="font-display text-base font-bold text-bp-300">
                    {p.n}
                  </span>
                  <span className="font-medium text-bp-mist">{p.title}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Lado direito: imagem do app com moldura arredondada */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-bp-line bg-bp-panel/40 p-4 shadow-2xl shadow-bp-500/10">
              <Image
                src="/images/three-steps.jfif"
                alt="Print do app BokashiPay mostrando os 3 passos para começar a vender"
                width={2528}
                height={1686}
                className="h-auto w-full rounded-2xl"
                priority
              />
            </div>
            {/* Glow decorativo atrás */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 50% at 50% 50%, rgba(122,58,255,0.25) 0%, rgba(10,6,18,0) 70%)",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
