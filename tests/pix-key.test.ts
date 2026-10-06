import assert from 'node:assert/strict'
import { classifyPixKey, isValidPixKey, pixKeyTypeLabel } from '../src/lib/pix-key'

let passed = 0
const t = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log('  ok  ' + name) }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + (e as Error).message); process.exitCode = 1 }
}

console.log('\nClassificação da chave PIX')
t('CPF com máscara', () => {
  const r = classifyPixKey('123.456.789-09')
  assert.equal(r.type, 'cpf'); assert.equal(r.valid, true)
})
t('CNPJ com máscara', () => {
  const r = classifyPixKey('12.345.678/0001-95')
  assert.equal(r.type, 'cnpj'); assert.equal(r.valid, true)
})
t('e-mail', () => {
  const r = classifyPixKey('joao@exemplo.com')
  assert.equal(r.type, 'email'); assert.equal(r.valid, true)
})
t('e-mail sem TLD é inválido', () => assert.equal(classifyPixKey('joao@local').valid, false))
t('telefone com +55', () => {
  const r = classifyPixKey('+5511999999999')
  assert.equal(r.type, 'phone'); assert.equal(r.valid, true)
})
t('chave aleatória (UUID)', () => {
  const r = classifyPixKey('123e4567-e89b-12d3-a456-426614174000')
  assert.equal(r.type, 'random'); assert.equal(r.valid, true)
})
t('lixo é inválido', () => assert.equal(isValidPixKey('abc def'), false))
t('vazio é inválido', () => assert.equal(isValidPixKey('   '), false))

console.log('\nCasos que NÃO podem ser confundidos')
t('telefone não vira CPF', () => assert.notEqual(classifyPixKey('+5511999999999').type, 'cpf'))
t('11 dígitos sem +55 ainda é CPF (PIX aceita)', () =>
  assert.equal(classifyPixKey('11999999999').type, 'cpf'))
t('UUID não é tratado como telefone', () =>
  assert.equal(classifyPixKey('123e4567-e89b-12d3-a456-426614174000').type, 'random'))
// tolerância deliberada: nobody types a PIX key without mask — people paste it
// masked. Rejecting would push valid keys away from the user for no security gain.
t('CPF colado com espaço é aceito (tolerância a máscara)', () => {
  const r = classifyPixKey('123 456 789 09')
  assert.equal(r.type, 'cpf'); assert.equal(r.valid, true)
})
t('parênteses e traços também são aceitos', () =>
  assert.equal(classifyPixKey('(11) 99999-9999').type, 'cpf'))
t('espaço no e-mail NÃO é tolerado', () =>
  assert.equal(isValidPixKey('joao silva@exemplo.com'), false))

console.log('\nRótulos')
t('tipo tem rótulo legível', () => assert.equal(pixKeyTypeLabel('cpf'), 'CPF'))
t('tipo desconhecido não quebra', () =>
  assert.equal(typeof pixKeyTypeLabel('inexistente'), 'string'))

console.log(`\n${passed} testes passaram`)