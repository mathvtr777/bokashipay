"use client";
import { motion } from "framer-motion";

export default function CtaFinal() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-bp-500/40 bg-gradient-to-br from-bp-700 via-bp-500 to-bp-900 p-12 text-center"
        >
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-bp-300/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-bp-300/20 blur-3xl" />

          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-white md:text-5xl">
              Mais controle. <br className="hidden md:block" />
              Mais vendas.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Crie sua conta grátis em menos de 1 minuto. Sem KYC, sem
              bloqueio, sem cartão.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-semibold text-bp-700 hover:bg-bp-mist"
              >
                Criar conta grátis
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 font-semibold text-white hover:bg-white/10"
              >
                Falar com um especialista
              </a>
            </div>
          </div>
        </motion.div>

        {/* Placeholder pra imagem do mockup final */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="placeholder-img mx-auto mt-12 aspect-[16/7] w-full max-w-4xl"
          aria-label="Mockup final do produto — substituir"
        >
          <span>📐 placeholder — mockup final</span>
        </motion.div>
      </div>
    </section>
  );
}