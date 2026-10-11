'use client';
import { Instagram, Mail, ShieldCheck, FileText } from 'lucide-react';

const cols = [
  {
    title: 'Produto',
    links: [
      ['Para quem é', '#para-quem-e'],
      ['Ferramentas', '#ferramentas'],
      ['Como funciona', '#como-funciona'],
      ['Preços', '#precos'],
      ['FAQ', '#faq'],
      ['Mais controle', '#controle'],
    ],
  },
  {
    title: 'Empresa',
    links: [
      ['Transparência', '#'],
      ['Política de privacidade', '#'],
      ['Política de segurança', '#'],
      ['Contato', '#'],
    ],
  },
];

/**
 * Footer — logo, descrição, ícones sociais, colunas de links e indicador
 * "Sistema operando normalmente".
 */
export default function Footer() {
  return (
    <footer className="relative border-t border-bp-line bg-bp-ink py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <a href="#" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-bp-500 font-display text-lg font-bold">
                B
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Bokashi<span className="text-bp-400">Pay</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-bp-mist/65">
              Sua conta digital simples e prática. Receba e envie PIX em
              segundos, com taxa baixa e sem burocracia.
            </p>
            <div className="mt-6 flex items-center gap-3 text-bp-mist/60">
              <a href="#" aria-label="Instagram" className="hover:text-white">
                <Instagram size={18} />
              </a>
              <a href="#" aria-label="E-mail" className="hover:text-white">
                <Mail size={18} />
              </a>
              <a href="#" aria-label="Segurança" className="hover:text-white">
                <ShieldCheck size={18} />
              </a>
              <a href="#" aria-label="Termos" className="hover:text-white">
                <FileText size={18} />
              </a>
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display text-sm font-semibold text-white">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-bp-mist/65">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-bp-line pt-6 text-xs text-bp-mist/55 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} BokashiPay. Todos os direitos reservados.</div>
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-green-500/20 text-green-400">
              ●
            </span>
            <span>Sistema operando normalmente</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
