import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Ajuda' }

const FAQ = [
  {
    question: 'Por que minha cobrança PIX aparece como "Pendente"?',
    answer:
      'Um QR Code é só a representação de um valor — quem confirma o pagamento é o provedor de pagamento. Sem um provedor conectado, a cobrança fica pendente de propósito. Assim que PIX_PROVIDER_URL e PIX_PROVIDER_API_KEY estiverem definidos, a cobrança passa a ser emitida de verdade e o status é atualizado pelo provedor.',
  },
  {
    question: 'Como recebo o pagamento de uma venda?',
    answer:
      'Cada venda aprovada gera uma entrada no seu extrato e aumenta o saldo disponível. O saldo é liberado para saque assim que o valor estiver aprovado.',
  },
  {
    question: 'Meu saque em cripto foi executado?',
    answer:
      'Um saque só aparece como concluído depois que um provedor de custódia devolve o identificador da retirada. Sem provedor configurado, o pedido fica pendente — nenhuma transferência é simulada.',
  },
  {
    question: 'Como configuro a integração UTMFY?',
    answer:
      'Vá em Integrações, informe o API key da sua conta e conecte. Depois cadastre a URL de webhook mostrada na tela no painel da UTMFY para começar a receber eventos.',
  },
  {
    question: 'Um usuário consegue ver os dados de outro?',
    answer:
      'Não. Todas as tabelas têm Row Level Security por usuário no banco, e o identificador do usuário vem sempre do token de autenticação — nunca dos dados enviados pelo navegador.',
  },
]

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="Ajuda" description="Respostas sobre como o BokashiPay funciona." />

      <div className="mx-auto max-w-3xl space-y-4">
        {FAQ.map((item) => (
          <Card key={item.question} className="p-5">
            <h2 className="text-sm font-semibold text-white text-white">
              {item.question}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60 text-white/70">
              {item.answer}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}