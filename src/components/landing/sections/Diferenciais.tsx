'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const beneficios = [
  'Sem KYC pra começar a vender',
  'Sem bloqueio por análise de risco',
  'Nominal em todas as transações',
  'Saque facilitado pra sua conta',
];

/**
 * Diferenciais — "Sem burocracia, sem bloqueio, sem KYC". Grid 2-col com
 * texto + lista de benefícios à esquerda e placeholder da imagem do
 * dashboard à direita.
 */
export default function Diferenciais() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold md:text-5xl">
              Sem burocracia,{' '}
              <span className="gradient-text">sem bloqueio, sem KYC.</span>
            </h2>
            <p className="mt-4 text-bp-mist/70">
              A BokashiPay foi feita pra quem vende. Aprovação rápida,
              nominal garantido e suporte humano.
            </p>
            <ul className="mt-8 space-y-4">
              {beneficios.map((b) => (
                <li key={b} className="flex items-center gap-3 text-bp-mist">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-bp-500/20 text-bp-300">
                    <Check size={14} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a href="#" className="btn-primary">
                Quero vender sem dor de cabeça
              </a>
            </div>
          </motion.div>

          {/* Placeholder pra imagem do dashboard / produto */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="placeholder-img aspect-[5/4] w-full"
            aria-label="Imagem do dashboard — substituir"
          >
            <span>📐 placeholder — imagem do dashboard</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
