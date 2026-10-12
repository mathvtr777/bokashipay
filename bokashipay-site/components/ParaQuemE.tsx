"use client";
import { motion } from "framer-motion";
import { Users, BadgeCheck, ArrowRight } from "lucide-react";

const publicos = [
  "Infoprodutores",
  "Afiliados",
  "Dropshipping",
  "E-commerce",
  "Negócios locais",
  "Prestadores de serviço",
  "Criadores de conteúdo",
  "Vendas pelo Telegram e WhatsApp",
];

export default function ParaQuemE() {
  return (
    <section id="para-quem-e" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Aberta pra todos os nichos
          </h2>
          <p className="mt-4 text-bp-mist/70">
            Sem burocracia, sem bloqueio, sem KYC.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-bp-line bg-bp-panel/70 p-8"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-bp-500/15 px-3 py-1 text-xs text-bp-300">
              <Users size={14} /> Aberta pra qualquer venda
            </div>
            <h3 className="font-display text-2xl font-semibold">
              Venda do seu jeito, sem amarras
            </h3>
            <ul className="mt-6 grid grid-cols-2 gap-3 text-sm text-bp-mist/80">
              {publicos.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <BadgeCheck size={14} className="text-bp-400" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-bp-500/40 bg-gradient-to-br from-bp-700 via-bp-500 to-bp-900 p-8"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-bp-300/30 blur-3xl" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                ⬆️ Fatura acima de R$ 10 mil/mês?
              </div>
              <h3 className="font-display text-2xl font-semibold leading-tight">
                Bora escalar com a BokashiPay
              </h3>
              <p className="mt-3 text-white/80">
                Atendimento humano, conta dedicada e taxa ainda menor pra
                quem movimenta alto.
              </p>
              <a
                href="#"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-bp-700 hover:bg-bp-mist"
              >
                Falar com um especialista <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}