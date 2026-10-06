import assert from 'node:assert/strict'
import { mapStatus, stripDataUrl, pushinError, MIN_VALUE_CENTS } from '../src/services/pix'

let passed = 0
const t = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log('  ok  ' + name) }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + (e as Error).message); process.exitCode = 1 }
}

console.log('\nCentavos e base64 (contrato Pushin Pay)')
t('qr_code_base64 chega como data URL e vira base64 puro', () =>
  assert.equal(
    stripDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='),
    'iVBORw0KGgoAAAANSUhEUg==',
  ))
t('base64 sem prefixo passa intacto', () =>
  assert.equal(stripDataUrl('iVBORw0KGgo='), 'iVBORw0KGgo='))
t('null vira string vazia, não "null"', () => assert.equal(stripDataUrl(null), ''))
t('mínimo do provedor é R$ 0,50', () => assert.equal(MIN_VALUE_CENTS, 50))

console.log('\nStatus (vocabulário do provedor -> domínio)')
t('created vira pending', () => assert.equal(mapStatus('created'), 'pending'))
t('paid vira paid', () => assert.equal(mapStatus('paid'), 'paid'))
t('canceled vira canceled', () => assert.equal(mapStatus('canceled'), 'canceled'))
t('expired vira expired', () => assert.equal(mapStatus('expired'), 'expired'))
t('cancelled (pt) também é cancelado', () => assert.equal(mapStatus('cancelled'), 'canceled'))
t('status desconhecido NÃO é lido como pago', () =>
  assert.equal(mapStatus('weird_status'), 'pending'))
t('string vazia não é paga', () => assert.equal(mapStatus(''), 'pending'))

console.log('\nErros do provedor')
t('usa a mensagem do provedor', () =>
  assert.equal(pushinError({ message: 'Valor acima do limite' }, 400),
    'Pushin Pay: Valor acima do limite'))
t('401 sem mensagem vira aviso de token', () =>
  assert.match(pushinError({}, 401), /PUSHINPAY_API_TOKEN/))
t('sem body e status genérico cita o status', () =>
  assert.match(pushinError(null, 500), /500/))

console.log('\nPath de consulta (regressão do bug do plural)')
// O índice da doc resume como /transaction/{id}; o endpoint real é
// /transactions/{id}. Este teste trava o caminho para o bug não voltar.
t('consulta usa "transactions" no plural', async () => {
  const { readFileSync } = await import('node:fs')
  const source = readFileSync('src/services/pix/index.ts', 'utf8')
  assert.match(source, /\/transactions\/\$\{encodeURIComponent\(providerRequestId\)\}/)
})
t('não sobrou o singular incorreto na chamada', async () => {
  const { readFileSync } = await import('node:fs')
  const source = readFileSync('src/services/pix/index.ts', 'utf8')
  assert.doesNotMatch(source, /baseUrl\}\/transaction\/\$\{/)
})

console.log(`\n${passed} testes passaram`)