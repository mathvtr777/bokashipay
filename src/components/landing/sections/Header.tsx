'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '#para-quem-e', label: 'Para quem é' },
  { href: '#ferramentas', label: 'Ferramentas' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
  { href: '#controle', label: 'Mais controle' },
];

/**
 * Header da landing pública (bokashipay-site). Fixo no topo, com barra de
 * atenção ("Fatura acima de R$ 10 mil/mês?"), logo B + wordmark, nav
 * desktop e menu mobile (hamburger com animação).
 */
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 z-50 w-full border-b border-bp-line/60 bg-bp-ink/70 backdrop-blur-md">
      {/* barra de atenção */}
      <div className="hidden bg-gradient-to-r from-bp-700 via-bp-500 to-bp-700 text-sm text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2">
          <span>📈 Fatura acima de R$ 10 mil/mês?</span>
          <a
            href="#"
            className="font-semibold underline-offset-2 hover:underline"
          >
            Bora escalar com a BokashiPay →
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <a href="#" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-bp-500 font-display text-lg font-bold">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Bokashi<span className="text-bp-400">Pay</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-bp-mist/80 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a href="#" className="btn-ghost !px-5 !py-2 text-sm">
            Fazer login
          </a>
          <a href="#" className="btn-primary !px-5 !py-2 text-sm">
            Criar conta grátis
          </a>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-bp-line p-2 lg:hidden"
          aria-label="Abrir menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-bp-line bg-bp-ink/95 px-6 py-4 lg:hidden"
        >
          <ul className="space-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-bp-mist/80"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <a href="#" className="btn-ghost flex-1 !py-2 text-sm">
              Fazer login
            </a>
            <a href="#" className="btn-primary flex-1 !py-2 text-sm">
              Criar conta grátis
            </a>
          </div>
        </motion.div>
      )}
    </header>
  );
}
