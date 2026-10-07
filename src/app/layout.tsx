import type { Metadata, Viewport } from 'next'
import { Manrope, Sora } from 'next/font/google'
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
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${sora.variable} font-sans antialiased`}
        style={{ ['--font-sans' as never]: `var(${manrope.variable})`, ['--font-display' as never]: `var(${sora.variable})` }}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}