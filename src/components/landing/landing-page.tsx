import Link from 'next/link'

const taxas = [
  {
    titulo: 'Receber via Pix',
    preco: 'R$ 0,80',
    descricao: 'por transação confirmada',
    destaque: true,
    features: [
      'Dinheiro disponível na hora',
      'Sem custo para gerar QR Code',
      'Aprovação instantânea',
    ],
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    titulo: 'Sacar via Pix',
    preco: 'R$ 0,80',
    descricao: 'nos primeiros 20 saques',
    destaque: false,
    features: [
      'Até 20 saques por mês: R$ 0,80 cada',
      'A partir do 21º saque: R$ 2,50 cada',
      'Saque automático ou manual',
    ],
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    titulo: 'Cobrar por Link',
    preco: 'R$ 0,80',
    descricao: 'por transação confirmada',
    destaque: false,
    features: [
      'Gere um link em segundos',
      'Compartilhe por WhatsApp, e-mail ou redes',
      'Sem precisar de site',
    ],
    icone: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
]

const features = [
  {
    titulo: 'Taxas fixas',
    descricao: 'Sem surpresas. Você paga o mesmo valor sempre, independente do valor da transação.',
  },
  {
    titulo: 'Receba na hora',
    descricao: 'O dinheiro cai na sua conta imediatamente após a confirmação do Pix.',
  },
  {
    titulo: 'Sem mensalidade',
    descricao: 'Você paga apenas pelas transações que realmente aconteceram.',
  },
  {
    titulo: 'Link de pagamento',
    descricao: 'Gere links personalizados e cobre de qualquer lugar, sem site.',
  },
  {
    titulo: 'Dashboard completo',
    descricao: 'Acompanhe todas as transações, saques e estatísticas em tempo real.',
  },
  {
    titulo: '100% online',
    descricao: 'Abra sua conta e comece a usar em minutos, sem burocracia.',
  },
]

const faqs = [
  {
    pergunta: 'Como funcionam as taxas?',
    resposta: 'Você paga apenas R$ 0,80 por transação Pix confirmada. Não há custo para gerar QR Codes ou links de pagamento. Para saques, os primeiros 20 do mês custam R$ 0,80 cada; a partir do 21º, R$ 2,50 cada.',
  },
  {
    pergunta: 'Preciso pagar mensalidade?',
    resposta: 'Não! Você paga apenas pelas transações que realizar. Não há custo fixo mensal.',
  },
  {
    pergunta: 'Em quanto tempo recebo o dinheiro?',
    resposta: 'O dinheiro fica disponível na sua conta instantaneamente após a confirmação do Pix pelo cliente.',
  },
  {
    pergunta: 'Posso vender qualquer valor?',
    resposta: 'Sim! Você pode definir qualquer valor para suas cobranças, de R$ 1,00 a quanto quiser.',
  },
  {
    pergunta: 'Como funciona o link de pagamento?',
    resposta: 'Você gera um link personalizado na dashboard, compartilha com seu cliente por WhatsApp, e-mail ou redes sociais. O cliente clica, faz o Pix, e você recebe na hora.',
  },
  {
    pergunta: 'Preciso de CNPJ para usar?',
    resposta: 'Não necessariamente. Você pode usar o BokashiPay mesmo como pessoa física para receber pagamentos.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <span className="text-xl font-bold">B</span>
              </div>
              <span className="text-xl font-bold">BokashiPay</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#taxas" className="text-ink-300 hover:text-white transition-colors">
                Taxas
              </a>
              <a href="#features" className="text-ink-300 hover:text-white transition-colors">
                Funcionalidades
              </a>
              <a href="#faq" className="text-ink-300 hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-ink-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all duration-200 shadow-lg shadow-brand-600/25"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[128px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/10 border border-brand-500/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              <span className="text-sm text-brand-300">Taxa fixa de R$ 0,80 por transação</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              O Pix que{' '}
              <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                trabalha pra você
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-ink-300 mb-10 max-w-2xl mx-auto">
              Aceite pagamentos via Pix com as menores taxas do mercado.
              Sem mensalidade, sem complicações. O dinheiro cai na hora.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all duration-200 shadow-xl shadow-brand-600/30"
              >
                Criar conta gratuita
              </Link>
              <a
                href="#taxas"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                Ver taxas
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">R$ 0,80</div>
                <div className="text-sm text-ink-400">por transação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">Instantâneo</div>
                <div className="text-sm text-ink-400">recebimento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">0%</div>
                <div className="text-sm text-ink-400">mensalidade</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-ink-400">disponível</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Taxas Section */}
      <section id="taxas" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Taxas simples e transparentes
            </h2>
            <p className="text-ink-300 text-lg max-w-2xl mx-auto">
              Sem cobranças escondidas. Você paga pouco e recebe muito.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {taxas.map((taxa, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ${
                  taxa.destaque
                    ? 'bg-gradient-to-br from-brand-600/20 to-brand-700/10 border-2 border-brand-500/50'
                    : 'bg-ink-900/50 border border-white/5 hover:border-white/10'
                }`}
              >
                {taxa.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-600 text-xs font-semibold text-white">
                    Mais popular
                  </div>
                )}

                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  taxa.destaque ? 'bg-brand-600 text-white' : 'bg-ink-800 text-brand-400'
                }`}>
                  {taxa.icone}
                </div>

                <h3 className="text-xl font-semibold mb-2">{taxa.titulo}</h3>
                <p className="text-ink-400 text-sm mb-4">{taxa.descricao}</p>

                <div className="text-3xl font-bold mb-6">
                  {taxa.preco}
                </div>

                <ul className="space-y-3">
                  {taxa.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-ink-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-ink-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-ink-300 text-lg max-w-2xl mx-auto">
              Ferramentas completas para gerenciar seus pagamentos de forma simples e eficiente.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-ink-950/50 border border-white/5 hover:border-brand-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-600/10 flex items-center justify-center mb-4 group-hover:bg-brand-600/20 transition-colors">
                  <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.titulo}</h3>
                <p className="text-ink-400 text-sm">{feature.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-ink-300 text-lg mb-8 max-w-2xl mx-auto">
            Abra sua conta gratuitamente e comece a receber pagamentos via Pix em minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all duration-200 shadow-xl shadow-brand-600/30"
          >
            Criar conta gratuita
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-ink-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-ink-300 text-lg">
              Tire suas dúvidas sobre o BokashiPay.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-xl bg-ink-950/50 border border-white/5 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-medium">{faq.pergunta}</span>
                  <svg
                    className="w-5 h-5 text-ink-400 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-ink-300">{faq.resposta}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <span className="text-xl font-bold">B</span>
              </div>
              <span className="text-xl font-bold">BokashiPay</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-ink-400">
              <Link href="/login" className="hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register" className="hover:text-white transition-colors">
                Criar Conta
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-sm text-ink-500">
              © 2024 BokashiPay. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
