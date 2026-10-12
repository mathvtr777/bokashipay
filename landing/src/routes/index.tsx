import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, ArrowRight, ChartNoAxesCombined, Layers3, Menu, Plus, X, MoveUpRight, Wallet, CircleCheck, ShieldCheck, ArrowUp, ArrowDown, ReceiptText, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/bokashi-logo.png.asset.json";
import painel from "@/assets/bokashi-painel-dark.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Bokashi | O próximo nível dos seus pagamentos" },
    { name: "description", content: "Conheça a Bokashi, o gateway de pagamento que conecta tecnologia e gestão financeira para o seu negócio." },
    { property: "og:title", content: "Bokashi | O próximo nível dos seus pagamentos" },
    { property: "og:description", content: "Tecnologia e gestão financeira em um só gateway de pagamento. Conheça a Bokashi." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

const faqs = [
  { question: "O que é a Bokashi?", answer: "A Bokashi é um gateway de pagamento: a conexão entre o seu negócio e os pagamentos dos seus clientes." },
  { question: "O que posso acompanhar no painel?", answer: "O painel apresentado reúne faturamento, transações aprovadas, saldo disponível e conversão geral, para uma visão centralizada da sua operação." },
  { question: "Quais são as taxas da Bokashi?", answer: "Nossa tabela completa está na seção Preços e Taxas: receber via Pix por R$ 0,80, sacar via Pix a partir de R$ 0,80, receber via Boleto por R$ 2,50 e cobrar por Link de Pagamento por R$ 0,80." },
  { question: "Como começar a usar a Bokashi?", answer: "A abertura de contas será disponibilizada em breve. Assim que o canal oficial de cadastro estiver disponível, você poderá começar por aqui." },
];

const rates: { icon: LucideIcon; name: string; price: string; perks: string[] }[] = [
  { icon: ArrowUp, name: "Receber via Pix", price: "R$ 0,80", perks: ["Dinheiro disponível agora", "Sem custo para gerar QR Code"] },
  { icon: ArrowDown, name: "Sacar via Pix", price: "R$ 0,80", perks: ["Até 20 saques por mês: R$ 0,80 cada", "A partir do 21º saque: R$ 2,50 cada", "Saque automático ou manual"] },
  { icon: ReceiptText, name: "Receber via Boleto", price: "R$ 2,50", perks: ["Sem custo para gerar", "Se pagar via Pix: R$ 0,80", "Pix + Boleto na mesma cobrança"] },
  { icon: Link2, name: "Cobrar por Link de Pagamento", price: "R$ 0,80", perks: ["Gere um link em segundos, sem precisar de site", "Compartilhe por WhatsApp, e-mail ou redes sociais", "Pix a R$ 0,80 por transação confirmada"] },
];

function Brand() {
  return <a href="#inicio" className="brand" aria-label="Bokashi — início"><img src={logo.url} alt="" /><span>bokashi<span className="brand-dot">.</span></span></a>;
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<"signup" | "login" | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const closeMenu = () => setMenuOpen(false);

  return <>
    <header className="site-header">
      <Brand />
      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Navegação principal">
        <a href="#solucoes" onClick={closeMenu}>Soluções</a><a href="#diferenciais" onClick={closeMenu}>Diferenciais</a><a href="#sobre" onClick={closeMenu}>Sobre nós</a><a href="#taxas" onClick={closeMenu}>Taxas</a>
      </nav>
      <div className="header-actions"><Button variant="navigation" onClick={() => setDialog("login")}>Entrar <ArrowUpRight /></Button><Button variant="brand" onClick={() => setDialog("signup")}>Criar conta <ArrowUpRight /></Button></div>
      <Button variant="navigation" size="icon" className="mobile-menu" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
    </header>

    <main>
      <section className="hero" id="inicio">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-mark" /> TECNOLOGIA QUE MOVE SEU NEGÓCIO <ArrowUpRight size={13} /></div>
          <h1>Bokashi. O próximo nível<br />dos seus <span>pagamentos.</span></h1>
          <p>Seu negócio em movimento. Seus pagamentos no controle.<br className="desktop-break" /> Conheça uma nova experiência em gateway de pagamento.</p>
          <div className="hero-actions"><Button variant="brand" onClick={() => setDialog("signup")}>Começar agora <ArrowUpRight /></Button><Button variant="outline" asChild><a href="#diferenciais">Conhecer a Bokashi <ArrowRight /></a></Button></div>
          <div className="hero-caption"><ShieldCheck size={14} /> Mais clareza para sua operação. Mais espaço para crescer.</div>
        </div>
        <div className="hero-visual">
          <div className="visual-note note-left"><span className="note-icon"><ChartNoAxesCombined size={22} /></span><span>Seu negócio.<br /><strong>Uma visão completa.</strong></span><div className="note-line" /></div>
          <img className="phone-image" src={painel} alt="Painel Bokashi no celular, com faturamento, transações aprovadas, saldo disponível e conversão" fetchPriority="high" />
          <div className="visual-note note-right"><span className="note-icon"><CircleCheck size={22} /></span><span>Seus pagamentos.<br /><strong>Você no controle.</strong></span><div className="note-line" /></div>
          <span className="visual-index">01 / CONECTE. RECEBA. EVOLUA.</span>
        </div>
      </section>

      <section className="tech-strip" aria-label="Bokashi"><div><span>MENOS COMPLEXIDADE.</span><span className="strip-highlight">MAIS POSSIBILIDADES.</span><ArrowUpRight /></div><span className="strip-caption">O seu próximo passo começa aqui.</span></section>

      <section className="section solutions" id="solucoes">
        <div className="section-heading"><span className="section-label">/ 01 — SOLUÇÕES</span><h2>Todo o seu movimento.<br /><span>Em um só lugar.</span></h2><p>Uma visão conectada dos pagamentos<br />e dos números que importam para você.</p></div>
        <div className="solution-grid">
          <article className="solution-item"><div className="feature-top"><Layers3 /><span>01</span></div><h3>Pagamentos conectados</h3><p>A conexão entre o seu negócio e as transações dos seus clientes.</p><span className="feature-bottom">GATEWAY DE PAGAMENTO <MoveUpRight size={18} /></span></article>
          <article className="solution-item"><div className="feature-top"><ChartNoAxesCombined /><span>02</span></div><h3>Visão da sua operação</h3><p>Faturamento, aprovações e conversão. Os números da sua operação, juntos.</p><span className="feature-bottom">GESTÃO EM UM SÓ PAINEL <MoveUpRight size={18} /></span></article>
          <article className="solution-item"><div className="feature-top"><Wallet /><span>03</span></div><h3>Clareza para crescer</h3><p>Acompanhe seu saldo e suas transações para planejar os próximos passos.</p><span className="feature-bottom">CONTROLE FINANCEIRO <MoveUpRight size={18} /></span></article>
        </div>
      </section>

      <section className="difference-section" id="diferenciais"><div className="difference-inner"><span className="section-label">/ 02 — POR QUE BOKASHI?</span><h2>O futuro não espera.<br /><span>Seu negócio também não.</span></h2><div className="difference-details"><p>Tecnologia não precisa ser complicada. A Bokashi aproxima você da sua operação, com informação clara e uma experiência que coloca seu negócio no centro.</p><Button variant="brand" onClick={() => setDialog("signup")}>Dar o próximo passo <ArrowUpRight /></Button></div><div className="difference-footer"><span>TECNOLOGIA</span><Plus /><span>CONTROLE</span><Plus /><span>EVOLUÇÃO</span></div></div></section>

      <section className="section about-section" id="sobre"><span className="section-label">/ 03 — SOMOS BOKASHI</span><div className="about-content"><h2>Conectando negócios.<br /><span>Movendo possibilidades.</span></h2><p>Somos um gateway de pagamento com uma ideia simples: aproximar tecnologia e negócios. Porque, por trás de cada transação, existe uma nova possibilidade.</p></div></section>

      <section className="section rates-section" id="taxas">
        <div className="section-heading"><span className="section-label">/ 04 — PREÇOS E TAXAS</span><h2>Transparente do início<br /><span>ao fim.</span></h2><p>Taxas por transação, direto ao ponto.<br />Você sabe exatamente o que paga.</p></div>
        <div className="rates-list">
          {rates.map((rate) => (
            <article className="rate-row" key={rate.name}>
              <div className="rate-id"><span className="rate-icon"><rate.icon /></span><h3>{rate.name}</h3></div>
              <p className="rate-price">{rate.price}</p>
              <ul className="rate-perks">{rate.perks.map((perk) => <li key={perk}><CircleCheck />{perk}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq-section" id="duvidas"><div><span className="section-label">/ 05 — DÚVIDAS FREQUENTES</span><h2>Vamos deixar<br /><span>tudo claro.</span></h2></div><div className="faq-list">{faqs.map((faq, i) => <div className="faq-item" key={faq.question}><Button variant="ghost" className="faq-question" aria-expanded={openFaq === i} aria-controls={`faq-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>{faq.question}<Plus className={openFaq === i ? "faq-plus open" : "faq-plus"} /></Button>{openFaq === i && <p id={`faq-${i}`}>{faq.answer}</p>}</div>)}</div></section>

      <section className="closing-section"><span className="section-label">SEU PRÓXIMO CAPÍTULO</span><h2>Vamos mover o seu negócio?</h2><Button variant="brand" onClick={() => setDialog("signup")}>Começar com a Bokashi <ArrowUpRight /></Button></section>
    </main>
    <footer className="site-footer"><div className="footer-top"><Brand /><span>Tecnologia que move possibilidades.</span><a href="#inicio">Voltar ao topo <ArrowUpRight size={16} /></a></div><div className="footer-bottom"><span>© 2026 Bokashi. Todos os direitos reservados.</span><span>GATEWAY DE PAGAMENTO</span></div></footer>

    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog === "login" ? "Seu acesso à Bokashi" : "Seu próximo passo com a Bokashi"}</DialogTitle><DialogDescription>{dialog === "login" ? "O endereço oficial do painel ainda não está disponível nesta página." : "A abertura de contas será disponibilizada em breve. Estamos preparando o canal oficial para você começar."}</DialogDescription></DialogHeader><Button variant="brand" onClick={() => setDialog(null)}>Entendi <ArrowRight /></Button></DialogContent></Dialog>
  </>;
}