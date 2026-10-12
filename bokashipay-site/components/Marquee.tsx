"use client";
import { motion } from "framer-motion";

const words = [
  "PIX",
  "INTEGRA",
  "AUTOMATIZA",
  "ESCALA",
  "SEU NEGÓCIO EM BOAS MÃOS",
  "BAIXA TAXA",
  "SEM KYC",
  "SEM BLOQUEIO",
];

export default function Marquee() {
  // duplicamos a lista pra fazer loop infinito sem costura
  const items = [...words, ...words];
  return (
    <section className="relative overflow-hidden border-y border-bp-line bg-bp-panel/60 py-6">
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap font-display text-2xl font-bold tracking-tight"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 30, repeat: Infinity }}
      >
        {items.map((w, i) => (
          <span
            key={i}
            className="flex items-center gap-10 text-bp-mist/40"
          >
            <span className={i % 2 === 0 ? "gradient-text" : ""}>{w}</span>
            <span className="text-bp-500">●</span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}