import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "BokashiPay — Sua conta digital simples e prática",
  description:
    "Receba e envie PIX em segundos, com taxa baixa, sem KYC e sem bloqueio. Ferramentas de venda e saque facilitado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className="bg-bp-ink text-bp-mist antialiased selection:bg-bp-500/40">
        {children}
      </body>
    </html>
  );
}
