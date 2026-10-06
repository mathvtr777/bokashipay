import assert from 'node:assert/strict'
import {
  calculateFee, calculateNet, computeAvailableBalance, computePendingBalance,
  computeConversionRate, computeMethodStats, percentChange, roundCurrency,
} from '../src/services/payments/rules'

let passed = 0
const t = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log('  ok  ' + name) }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + (e as Error).message); process.exitCode = 1 }
}

console.log('\nTaxas')
t('pix cobra 0,99% com 2 casas', () => assert.equal(calculateFee(100, 'pix'), 0.99))
t('cartão cobra 3,49%', () => assert.equal(calculateFee(100, 'card'), 3.49))
t('boleto não cobra taxa', () => assert.equal(calculateFee(100, 'boleto'), 0))
t('método desconhecido não cobra', () => assert.equal(calculateFee(100, 'carrier_pigeon'), 0))
t('líquo = bruto - taxa', () => assert.equal(calculateNet(100, 'pix'), 99.01))
t('arredonda para 2 casas', () => assert.equal(roundCurrency(0.1 + 0.2), 0.3))
t('centavo não some na taxa', () => assert.equal(calculateFee(33.33, 'pix'), 0.33))

console.log('\nSaldos')
const tx = (status: string, net: number) => ({ status, net_amount: net }) as any
t('saldo disponível só conta aprovadas', () =>
  assert.equal(computeAvailableBalance([tx('approved', 100), tx('pending', 50), tx('refunded', 20)]), 100))
t('saldo pendente separa as pendentes', () =>
  assert.equal(computePendingBalance([tx('approved', 100), tx('pending', 50), tx('pending', 25)]), 75))
t('soma de várias aprovadas', () =>
  assert.equal(computeAvailableBalance([tx('approved', 10.5), tx('approved', 20.25)]), 30.75))
t('lista vazia = zero', () => assert.equal(computeAvailableBalance([]), 0))

console.log('\nConversão')
t('aprovadas sobre total', () =>
  assert.equal(Math.round(computeConversionRate([tx('approved',1), tx('approved',1), tx('pending',1)])), 67))
t('sem vendas não divide por zero', () => assert.equal(computeConversionRate([]), 0))

console.log('\nMétodos de pagamento')
t('sempre lista os três métodos', () => {
  const s = computeMethodStats([])
  assert.deepEqual(s.map(m => m.label).sort(), ['Boleto', 'Cartão', 'PIX'])
  assert.equal(s.every(m => m.count === 0 && m.percentage === 0), true)
})
t('percentual relativo ao total', () => {
  const s = computeMethodStats([{ method: 'pix', amount: 10, status: 'approved' },
                                { method: 'card', amount: 10, status: 'approved' },
                                { method: 'card', amount: 10, status: 'approved' }])
  // 1 de 3 vendas = 33.333…%; o arredondamento acontece só na exibição.
  assert.equal(roundCurrency(s.find(m => m.label === 'PIX')!.percentage), 33.33)
  assert.equal(s.find(m => m.label === 'Cartão')!.count, 2)
  assert.equal(roundCurrency(s.find(m => m.label === 'Cartão')!.percentage), 66.67)
})
t('percentuais somam 100', () => {
  const s = computeMethodStats([{ method: 'pix', amount: 1, status: 'approved' }, { method: 'boleto', amount: 1, status: 'approved' }])
  assert.equal(roundCurrency(s.reduce((a, m) => a + m.percentage, 0)), 100)
})
t('valor movimentado acumula', () => {
  const s = computeMethodStats([{ method: 'pix', amount: 10.5, status: 'approved' }, { method: 'pix', amount: 4.5, status: 'approved' }])
  assert.equal(s.find(m => m.label === 'PIX')!.amount, 15)
})

console.log('\nVariação percentual')
t('subida positiva', () => assert.equal(percentChange(150, 100), 50))
t('queda negativa', () => assert.equal(percentChange(50, 100), -50))
t('de zero para positivo é null (evita inf)', () => assert.equal(percentChange(10, 0), null))
t('ambos zero é 0', () => assert.equal(percentChange(0, 0), 0))

console.log(`\n${passed} testes passaram`)