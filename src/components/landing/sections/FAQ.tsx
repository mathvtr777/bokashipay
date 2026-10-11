'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    q: 'Preciso fazer KYC pra começar?',
    a: 'Não. Você pode começar a receber PIX sem KYC. A verificação é recomendada apenas pra saques acima de certos limites.',
  },
  {
    q: 'Tem bloqueio por análise de risco?',
    a: 'Não. Suas vendas entram direto na conta, sem análise automática que segura o dinheiro.',
  },
  {
    q: 'Qual a taxa cobrada?',
    a: 'R$ 1,50 fixo por venda, mais a taxa da sua conta (varia conforme o tipo de conta: nominal, cliente, etc).',
  },
  {
    q: 'Como funciona o nominal?',
    a: 'Cada PIX que você recebe tem o nome do seu cliente identificado, trazendo segurança pra você e pra sua operação.',
  },
  {
    q: 'Quanto tempo pra sacar?',
    a: 'Saques são processados em minutos pra conta cadastrada.',
  },
  {
    q: 'Posso usar pra receber no Telegram?',
    a: 'Sim. Integração direta com bots de Telegram, pronta pra usar.',
  },
  {
    q: 'Posso usar no WhatsApp?',
    a: 'Sim. Gere links de pagamento e envie direto na conversa.',
  },
  {
    q: 'Tem suporte humano?',
    a: 'Sim, suporte via WhatsApp com gente que entende do seu negócio.',
  },
  {
    q: 'Tem API?',
    a: 'Sim. API REST completa + webhooks pra integrar com qualquer sistema.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Sem fidelidade, sem multa. Você só fica se quiser ficar.',
  },
];

/**
 * FAQ — accordion de 10 perguntas. Abre/fecha um item por vez, primeiro
 * item começa aberto. Animação de altura com `AnimatePresence` para
 * transição suave.
 */
export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-5xl">
            Perguntas frequentes
          </h2>
          <p className="mt-4 text-bp-mist/70">
            Ficou com dúvida? Aqui estão as respostas mais comuns.
          </p>
        </motion.div>

        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="overflow-hidden rounded-2xl border border-bp-line bg-bp-panel/60"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display font-semibold text-white">
                    {f.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-bp-mist/60 transition ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-bp-mist/75">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
