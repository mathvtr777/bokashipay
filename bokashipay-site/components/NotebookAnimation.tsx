"use client";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Animação de "dashboard com números animando" dentro de um notebook SVG.
 * Os números incrementam em loop usando easing, dando a sensação de um
 * painel ao vivo recebendo vendas em tempo real.
 */
export default function NotebookAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div ref={ref} className="relative">
      {/* halo roxo atrás */}
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-bp-500/20 blur-3xl" />

      <div className="relative rounded-[28px] border border-bp-line bg-bp-panel p-3 shadow-2xl shadow-bp-500/20">
        {/* tampa do notebook */}
        <div className="rounded-t-[20px] bg-gradient-to-b from-bp-ink to-[#0d0719] p-2">
          {/* "tela" */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] border border-bp-line bg-[#0a0612]">
            {/* topbar da tela */}
            <div className="flex items-center justify-between border-b border-bp-line bg-bp-panel/80 px-4 py-2 text-[11px] text-bp-mist/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <span>app.bokashipay.com</span>
              <span className="text-bp-400">● ao vivo</span>
            </div>

            {/* dashboard */}
            <DashboardContent active={inView} />
          </div>
        </div>

        {/* base do notebook (teclado) */}
        <div className="mx-auto mt-2 h-3 w-[80%] rounded-b-2xl bg-gradient-to-b from-bp-line to-bp-ink" />
        <div className="mx-auto mt-1 h-1.5 w-[40%] rounded-full bg-bp-line/80" />
      </div>
    </div>
  );
}

function DashboardContent({ active }: { active: boolean }) {
  const [saldo, setSaldo] = useState(0);
  const [vendas, setVendas] = useState(0);
  const [aprovacao, setAprovacao] = useState(0);
  const [ultimas, setUltimas] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();

    // alvos finais
    const targets = { saldo: 48750.32, vendas: 1284, aprovacao: 98.7, ultimas: 12 };
    const dur = 1800;

    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
      setSaldo(targets.saldo * e);
      setVendas(Math.floor(targets.vendas * e));
      setAprovacao(targets.aprovacao * e);
      setUltimas(Math.floor(targets.ultimas * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  // loop contínuo: depois de parar, recomeça após 4s
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      setSaldo(0); setVendas(0); setAprovacao(0); setUltimas(0);
    }, 4000);
    return () => clearTimeout(t);
  }, [saldo]);

  const fmtBRL = (n: number) =>
    n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    });

  return (
    <div className="grid h-full grid-cols-12 gap-3 p-4 text-[12px]">
      {/* sidebar */}
      <div className="col-span-3 space-y-2 rounded-lg border border-bp-line bg-bp-panel/60 p-3">
        <div className="font-display text-sm font-semibold text-white">
          Bokashi<span className="text-bp-400">Pay</span>
        </div>
        <div className="mt-3 space-y-1.5 text-bp-mist/70">
          {["Dashboard", "Vendas", "Link de pagamento", "Saques", "Clientes", "Configurações"].map((i, idx) => (
            <div
              key={i}
              className={`rounded-md px-2 py-1.5 ${
                idx === 0 ? "bg-bp-500/15 text-white" : "hover:bg-bp-line/50"
              }`}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      {/* conteúdo */}
      <div className="col-span-9 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Saldo disponível" value={fmtBRL(saldo)} accent />
          <Stat label="Vendas hoje" value={vendas.toLocaleString("pt-BR")} />
          <Stat label="Taxa de aprovação" value={`${aprovacao.toFixed(1)}%`} />
        </div>

        {/* gráfico de barras fake */}
        <div className="rounded-lg border border-bp-line bg-bp-panel/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-bp-mist/70">Vendas — últimas 24h</span>
            <span className="text-bp-400">+{aprovacao.toFixed(1)}%</span>
          </div>
          <Sparkline />
        </div>

        {/* últimas vendas */}
        <div className="rounded-lg border border-bp-line bg-bp-panel/60 p-3">
          <div className="mb-2 text-bp-mist/70">Últimas vendas</div>
          <div className="space-y-1.5">
            {Array.from({ length: ultimas }).slice(0, 5).map((_, i) => (
              <motion.div
                key={`${ultimas}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-md bg-bp-ink/60 px-2 py-1.5"
              >
                <span className="text-bp-mist/80">PIX #{1000 + i}</span>
                <span className="font-mono text-bp-300">
                  R$ {(Math.random() * 800 + 50).toFixed(2).replace(".", ",")}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent
          ? "border-bp-500/50 bg-bp-500/10"
          : "border-bp-line bg-bp-panel/60"
      }`}
    >
      <div className="text-bp-mist/60">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function Sparkline() {
  // barras com alturas animadas
  const heights = [42, 58, 36, 72, 50, 88, 64, 80, 46, 92, 70, 84];
  return (
    <div className="flex h-20 items-end gap-1.5">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: i * 0.04, duration: 0.6, ease: "easeOut" }}
          className="flex-1 rounded-t bg-gradient-to-t from-bp-700 to-bp-400"
        />
      ))}
    </div>
  );
}
