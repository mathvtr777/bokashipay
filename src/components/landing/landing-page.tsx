'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ArrowRight,
  ChartNoAxesCombined,
  Layers3,
  Menu,
  Plus,
  X,
  MoveUpRight,
  Wallet,
  CircleCheck,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  ReceiptText,
  Link2,
  type LucideIcon,
} from 'lucide-react'

/* Ícones tipados para passar a `<button>`/`<a>` via wrapper e permitir `asChild`. */
type IconComponent = LucideIcon | React.ComponentType<{ size?: number; className?: string }>

const faqs = [
  {
    question: 'O que é a Bokashi?',
    answer:
      'A Bokashi é um gateway de pagamento: a conexão entre o seu negócio e os pagamentos dos seus clientes.',
  },
  {
    question: 'O que posso acompanhar no painel?',
    answer:
      'O painel apresentado reúne faturamento, transações aprovadas, saldo disponível e conversão geral, para uma visão centralizada da sua operação.',
  },
  {
    question: 'Quais são as taxas da Bokashi?',
    answer:
      'Nossa tabela completa está na seção Preços e Taxas: receber via Pix por R$ 0,80, sacar via Pix a partir de R$ 0,80, receber via Boleto por R$ 2,50 e cobrar por Link de Pagamento por R$ 0,80.',
  },
  {
    question: 'Como começar a usar a Bokashi?',
    answer:
      'Crie sua conta gratuita e, em poucos minutos, você já pode gerar cobranças e acompanhar suas vendas pelo painel.',
  },
]

const rates: { icon: IconComponent; name: string; price: string; perks: string[] }[] = [
  { icon: ArrowUp, name: 'Receber via Pix', price: 'R$ 0,80', perks: ['Dinheiro disponível agora', 'Sem custo para gerar QR Code'] },
  { icon: ArrowDown, name: 'Sacar via Pix', price: 'R$ 0,80', perks: ['Até 20 saques por mês: R$ 0,80 cada', 'A partir do 21º saque: R$ 2,50 cada', 'Saque automático ou manual'] },
  { icon: ReceiptText, name: 'Receber via Boleto', price: 'R$ 2,50', perks: ['Sem custo para gerar', 'Se pagar via Pix: R$ 0,80', 'Pix + Boleto na mesma cobrança'] },
  { icon: Link2, name: 'Cobrar por Link de Pagamento', price: 'R$ 0,80', perks: ['Gere um link em segundos, sem precisar de site', 'Compartilhe por WhatsApp, e-mail ou redes sociais', 'Pix a R$ 0,80 por transação confirmada'] },
]

function Brand({ asLink = false }: { asLink?: boolean }) {
  const content = (
    <>
      <img src="/landing/logo.png" alt="Bokashi" width={42} height={42} />
      <span>
        bokashi<span className="brand-dot">.</span>
      </span>
    </>
  )
  if (asLink) {
    return (
      <Link href="/#inicio" className="brand" aria-label="Bokashi — início">
        {content}
      </Link>
    )
  }
  return (
    <a href="#inicio" className="brand" aria-label="Bokashi — início">
      {content}
    </a>
  )
}

function PrimaryButton({
  href,
  children,
  size = 'md',
}: {
  href: string
  children: ReactNode
  size?: 'sm' | 'md'
}) {
  return (
    <Link href={href} className="brand-button" data-size={size}>
      {children}
    </Link>
  )
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  )
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <header className="site-header">
        <Brand asLink />
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Navegação principal">
          <NavLink href="#solucoes" onClick={closeMenu}>
            Soluções
          </NavLink>
          <NavLink href="#diferenciais" onClick={closeMenu}>
            Diferenciais
          </NavLink>
          <NavLink href="#sobre" onClick={closeMenu}>
            Sobre nós
          </NavLink>
          <NavLink href="#taxas" onClick={closeMenu}>
            Taxas
          </NavLink>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="navigation-button">
            Entrar <ArrowUpRight />
          </Link>
          <PrimaryButton href="/register" size="sm">
            Criar conta <ArrowUpRight />
          </PrimaryButton>
        </div>
        <button
          type="button"
          className="mobile-menu"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-mark" /> TECNOLOGIA QUE MOVE SEU NEGÓCIO <ArrowUpRight size={13} />
            </div>
            <h1>
              Bokashi. O próximo nível
              <br />
              dos seus <span>pagamentos.</span>
            </h1>
            <p>
              Seu negócio em movimento. Seus pagamentos no controle.
              <br className="desktop-break" /> Conheça uma nova experiência em gateway de pagamento.
            </p>
            <div className="hero-actions">
              <PrimaryButton href="/register">Começar agora <ArrowUpRight /></PrimaryButton>
              <Link href="#diferenciais" className="outline-cta">
                Conhecer a Bokashi <ArrowRight />
              </Link>
            </div>
            <div className="hero-caption">
              <ShieldCheck size={14} /> Mais clareza para sua operação. Mais espaço para crescer.
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-note note-left">
              <span className="note-icon">
                <ChartNoAxesCombined size={22} />
              </span>
              <span>
                Seu negócio.
                <br />
                <strong>Uma visão completa.</strong>
              </span>
              <div className="note-line" />
            </div>
            <img
              className="phone-image"
              src="/landing/painel-dark.png"
              alt="Painel Bokashi no celular, com faturamento, transações aprovadas, saldo disponível e conversão"
              width={350}
              height={350}
              fetchPriority="high"
            />
            <div className="visual-note note-right">
              <span className="note-icon">
                <CircleCheck size={22} />
              </span>
              <span>
                Seus pagamentos.
                <br />
                <strong>Você no controle.</strong>
              </span>
              <div className="note-line" />
            </div>
            <span className="visual-index">01 / CONECTE. RECEBA. EVOLUA.</span>
          </div>
        </section>

        <section className="tech-strip" aria-label="Bokashi">
          <div>
            <span>MENOS COMPLEXIDADE.</span>
            <span className="strip-highlight">MAIS POSSIBILIDADES.</span>
            <ArrowUpRight />
          </div>
          <span className="strip-caption">O seu próximo passo começa aqui.</span>
        </section>

        <section className="section solutions" id="solucoes">
          <div className="section-heading">
            <span className="section-label">/ 01 — SOLUÇÕES</span>
            <h2 className="landing-h2">
              Todo o seu movimento.
              <br />
              <span>Em um só lugar.</span>
            </h2>
            <p>
              Uma visão conectada dos pagamentos
              <br />e dos números que importam para você.
            </p>
          </div>
          <div className="solution-grid">
            <article className="solution-item">
              <div className="feature-top">
                <Layers3 /> <span>01</span>
              </div>
              <h3>Pagamentos conectados</h3>
              <p>A conexão entre o seu negócio e as transações dos seus clientes.</p>
              <span className="feature-bottom">
                GATEWAY DE PAGAMENTO <MoveUpRight size={18} />
              </span>
            </article>
            <article className="solution-item">
              <div className="feature-top">
                <ChartNoAxesCombined /> <span>02</span>
              </div>
              <h3>Visão da sua operação</h3>
              <p>Faturamento, aprovações e conversão. Os números da sua operação, juntos.</p>
              <span className="feature-bottom">
                GESTÃO EM UM SÓ PAINEL <MoveUpRight size={18} />
              </span>
            </article>
            <article className="solution-item">
              <div className="feature-top">
                <Wallet /> <span>03</span>
              </div>
              <h3>Clareza para crescer</h3>
              <p>Acompanhe seu saldo e suas transações para planejar os próximos passos.</p>
              <span className="feature-bottom">
                CONTROLE FINANCEIRO <MoveUpRight size={18} />
              </span>
            </article>
          </div>
        </section>

        <section className="difference-section" id="diferenciais">
          <div className="difference-inner">
            <span className="section-label">/ 02 — POR QUE BOKASHI?</span>
            <h2 className="landing-h2">
              O futuro não espera.
              <br />
              <span>Seu negócio também não.</span>
            </h2>
            <div className="difference-details">
              <p>
                Tecnologia não precisa ser complicada. A Bokashi aproxima você da sua operação, com
                informação clara e uma experiência que coloca seu negócio no centro.
              </p>
              <PrimaryButton href="/register">Dar o próximo passo <ArrowUpRight /></PrimaryButton>
            </div>
            <div className="difference-footer">
              <span>TECNOLOGIA</span>
              <Plus />
              <span>CONTROLE</span>
              <Plus />
              <span>EVOLUÇÃO</span>
            </div>
          </div>
        </section>

        <section className="section about-section" id="sobre">
          <span className="section-label">/ 03 — SOMOS BOKASHI</span>
          <div className="about-content">
            <h2 className="landing-h2">
              Conectando negócios.
              <br />
              <span>Movendo possibilidades.</span>
            </h2>
            <p>
              Somos um gateway de pagamento com uma ideia simples: aproximar tecnologia e negócios.
              Porque, por trás de cada transação, existe uma nova possibilidade.
            </p>
          </div>
        </section>

        <section className="section rates-section" id="taxas">
          <div className="section-heading">
            <span className="section-label">/ 04 — PREÇOS E TAXAS</span>
            <h2 className="landing-h2">
              Transparente do início
              <br />
              <span>ao fim.</span>
            </h2>
            <p>
              Taxas por transação, direto ao ponto.
              <br />Você sabe exatamente o que paga.
            </p>
          </div>
          <div className="rates-list">
            {rates.map((rate) => {
              const Icon = rate.icon
              return (
                <article className="rate-row" key={rate.name}>
                  <div className="rate-id">
                    <span className="rate-icon">
                      <Icon />
                    </span>
                    <h3>{rate.name}</h3>
                  </div>
                  <p className="rate-price">{rate.price}</p>
                  <ul className="rate-perks">
                    {rate.perks.map((perk) => (
                      <li key={perk}>
                        <CircleCheck /> {perk}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>

        <section className="section faq-section" id="duvidas">
          <div>
            <span className="section-label">/ 05 — DÚVIDAS FREQUENTES</span>
            <h2 className="landing-h2">
              Vamos deixar
              <br />
              <span>tudo claro.</span>
            </h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={faq.question}>
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.question}
                  <Plus className={openFaq === i ? 'faq-plus open' : 'faq-plus'} />
                </button>
                {openFaq === i && <p id={`faq-${i}`}>{faq.answer}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="closing-section">
          <span className="section-label">SEU PRÓXIMO CAPÍTULO</span>
          <h2 className="landing-h2">Vamos mover o seu negócio?</h2>
          <PrimaryButton href="/register">Começar com a Bokashi <ArrowUpRight /></PrimaryButton>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <Brand />
          <span>Tecnologia que move possibilidades.</span>
          <a href="#inicio">
            Voltar ao topo <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Bokashi. Todos os direitos reservados.</span>
          <span>GATEWAY DE PAGAMENTO</span>
        </div>
      </footer>
    </>
  )
}

// Reaproveita o tipo de props de LucideIcon para uso no array `rates`
// (mantido apenas para o type-checker — sem runtime).
export type _IconProps = ComponentProps<LucideIcon>