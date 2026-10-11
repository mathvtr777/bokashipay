import Header from './sections/Header';
import Hero from './sections/Hero';
import DashboardScroll from './sections/DashboardScroll';
import Marquee from './sections/Marquee';
import ParaQuemE from './sections/ParaQuemE';
import Ferramentas from './sections/Ferramentas';
import ComoFunciona from './sections/ComoFunciona';
import Diferenciais from './sections/Diferenciais';
import ThreeSteps from './sections/ThreeSteps';
import Precos from './sections/Precos';
import MaisControle from './sections/MaisControle';
import FAQ from './sections/FAQ';
import CtaFinal from './sections/CtaFinal';
import Footer from './sections/Footer';

/**
 * Landing page pública do BokashiPay (bokashipay-site).
 *
 * Renderizada por `src/app/page.tsx` para visitantes deslogados; usuários
 * autenticados são redirecionados para `/dashboard`. A composição aqui
 * espelha a ordem da home original da `bokashipay-site`.
 */
export default function LandingPage() {
  return (
    <main className="bg-bp-ink font-sans text-bp-mist antialiased">
      <Header />
      <Hero />
      <DashboardScroll />
      <Marquee />
      <ParaQuemE />
      <Ferramentas />
      <ComoFunciona />
      <Diferenciais />
      <ThreeSteps />
      <Precos />
      <MaisControle />
      <FAQ />
      <CtaFinal />
      <Footer />
    </main>
  );
}
