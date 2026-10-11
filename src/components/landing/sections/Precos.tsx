'use client';
import { motion } from 'framer-motion';
import { ArrowDown, TrendingDown } from 'lucide-react';

/**
 * Precos — "A menor taxa do mercado". Comparativo 2-col: card esquerdo
 * riscado mostrando "3-8%" de outras plataformas vs card direito em
 * gradiente roxo mostrando o "R$ 1,50 fixo" da BokashiPay.
 */
export default function Precos() {
  return (
    <section id="precos" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            A <span className="gradient-text">menor taxa</span> do mercado
          </h2>
          <p className="mt-4 text-bp-mist/70">
            Enquanto outras plataformas cobram 3% a 8%, a BokashiPay cobra{' '}
            <strong className="text-white">R$ 1,50 fixo</strong> + a taxa da
            sua conta.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-bp-line bg-bp-panel/60 p-8"
          >
            <div className="flex items-center gap-2 text-bp-mist/60">
              <TrendingDown size={16} /> Outras plataformas
            </div>
            <div className="mt-3 font-display text-5xl font-bold text-bp-mist/70 line-through decoration-bp-500/60">
              3–8%
            </div>
            <p className="mt-3 text-sm text-bp-mist/60">
              Por venda, fora taxa de saque. Ah, e bloqueio por análise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-bp-500/50 bg-gradient-to-br from-bp-700 via-bp-500 to-bp-900 p-8"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-bp-300/30 blur-3xl" />
            <div className="relative">
              <div className="text-white/80">BokashiPay</div>
              <div className="mt-3 flex items-baseline gap-2 font-display">
                <span className="text-5xl font-bold text-white">R$ 1,50</span>
                <span className="text-white/70">fixo</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <ArrowDown size={14} /> + taxa da sua conta
              </div>
              <p className="mt-3 text-sm text-white/80">
                Sem bloqueio, sem análise, nominal garantido.
              </p>
              <a
                href="#"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-bp-700 hover:bg-bp-mist"
              >
                Quero pagar menos por venda →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
