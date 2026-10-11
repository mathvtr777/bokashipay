import type { Metadata, Viewport } from 'next'
import { Inter, Manrope, Sora } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

// Inter é a fonte "sans" da landing pública (bokashipay-site). Manrope
// continua sendo a fonte default do app logado (mapeada em --font-sans).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Bokashi | O próximo nível dos seus pagamentos',
    template: '%s · BokashiPay',
  },
  description:
    'Bokashi. Tecnologia para os pagamentos do seu negócio. Gateway de pagamento completo com PIX, vendas, financeiro e saques em cripto.',
  openGraph: {
    title: 'Bokashi | O próximo nível dos seus pagamentos',
    description:
      'Tecnologia e gestão financeira em um só gateway de pagamento. Conheça a Bokashi.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e1016',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Tema único (escuro) — `<html class="dark">` é fixo, sem toggle.
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${sora.variable} ${inter.variable} font-sans antialiased`}
        style={{
          ['--font-sans' as never]: `var(${manrope.variable})`,
          ['--font-display' as never]: `var(${sora.variable})`,
          ['--font-inter' as never]: `var(${inter.variable})`,
        }}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}