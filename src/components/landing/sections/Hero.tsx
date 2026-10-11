'use client';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, Plug } from 'lucide-react';

/**
 * Hero da landing pública (bokashipay-site). Seção principal com headline,
 * CTAs e chips de valor. Usa o gradiente sutil `.bg-grid` e o `.gradient-text`
 * da globals.css.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid pt-40 pb-24">
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="chip">
            <Sparkles size={14} className="text-bp-300" />
            PIX mais inteligente para o seu negócio
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Esprema mais de cada venda e faça seu negócio{' '}
            <span className="gradient-text">dar frutos.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-bp-mist/75 md:text-lg">
            Receba PIX com nominal, automatize vendas e tenha liberdade pra
            escalar. Sem KYC, sem bloqueio, sem dor de cabeça.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#" className="btn-primary">
              Criar minha conta
            </a>
            <a href="#" className="btn-ghost">
              Falar com um especialista
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-bp-mist/70">
            <li className="chip">
              <ShieldCheck size={14} className="text-bp-300" /> 100% seguro
            </li>
            <li className="chip">
              <Zap size={14} className="text-bp-300" /> Aprovação rápida
            </li>
            <li className="chip">
              <Plug size={14} className="text-bp-300" /> Integração simples
            </li>
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
