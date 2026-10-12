import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DashboardScroll from "@/components/DashboardScroll";
import Marquee from "@/components/Marquee";
import ParaQuemE from "@/components/ParaQuemE";
import Ferramentas from "@/components/Ferramentas";
import ComoFunciona from "@/components/ComoFunciona";
import Diferenciais from "@/components/Diferenciais";
import ThreeSteps from "@/components/ThreeSteps";
import Precos from "@/components/Precos";
import MaisControle from "@/components/MaisControle";
import FAQ from "@/components/FAQ";
import CtaFinal from "@/components/CtaFinal";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
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
