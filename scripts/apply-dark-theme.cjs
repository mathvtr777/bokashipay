// Aplica a refatoração dark-first em todos os arquivos .tsx/.ts sob src/.
// Estratégia: o tema é dark único, então onde havia `dark:classe` queremos
// só `classe`. Onde havia `light-class dark:dark-class`, mantemos só
// `dark-class`. Removemos o par `dark:...` que duplica.
//
// Também converte cores semânticas legadas para a paleta nova:
//   - text-ink-* / bg-ink-* / border-ink-* que eram usadas para tema light, viram
//     white/* em opacidade ou surface.
//   - Cores de status emerald/amber/sky/red (não-/badge) → white/* em opacidade
//     quando usadas como cor de destaque.
//
// Idempotente: rodar 2x não causa duplicação.

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve('src')

const FILES = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else if (/\.(tsx|ts)$/.test(entry.name)) FILES.push(p)
  }
}
walk(ROOT)

const REPLACEMENTS = [
  // 1. Remove `dark:xxx` em qualquer lugar (vira `xxx` puro). O tema é dark.
  [/(\s)dark:([a-z0-9/\[\]_.%]+)/g, '$1$2'],
  // 2. Remove classes redundantes em pares `xxx dark:xxx` (mesma classe).
  [/(\s)([a-z0-9/\[\]_.%]+)(\s)\2(\s|$)/g, '$1$2$3$4'],
  // 3. Substituições de cores de texto "ink-*" para a paleta dark
  [/\btext-ink-50\b/g, 'text-white'],
  [/\btext-ink-100\b/g, 'text-white/90'],
  [/\btext-ink-200\b/g, 'text-white/80'],
  [/\btext-ink-300\b/g, 'text-white/70'],
  [/\btext-ink-400\b/g, 'text-white/50'],
  [/\btext-ink-500\b/g, 'text-white/50'],
  [/\btext-ink-600\b/g, 'text-white/60'],
  [/\btext-ink-700\b/g, 'text-white/70'],
  [/\btext-ink-800\b/g, 'text-white/80'],
  [/\btext-ink-900\b/g, 'text-white'],
  // 4. Cores de background ink-*
  [/\bbg-ink-50\b/g, 'bg-white/[0.04]'],
  [/\bbg-ink-100\b/g, 'bg-white/[0.04]'],
  [/\bbg-ink-200\b/g, 'bg-white/[0.06]'],
  [/\bbg-ink-300\b/g, 'bg-white/[0.10]'],
  [/\bbg-ink-400\b/g, 'bg-white/[0.12]'],
  [/\bbg-ink-500\b/g, 'bg-white/[0.14]'],
  [/\bbg-ink-600\b/g, 'bg-white/[0.14]'],
  [/\bbg-ink-700\b/g, 'bg-white/[0.2]'],
  [/\bbg-ink-800\b/g, 'bg-white/[0.08]'],
  [/\bbg-ink-900\b/g, 'bg-ink-900'],
  [/\bbg-ink-950\b/g, 'bg-ink-950'],
  // 5. Borders ink-*
  [/\bborder-ink-50\b/g, 'border-white/[0.04]'],
  [/\bborder-ink-100\b/g, 'border-white/[0.06]'],
  [/\bborder-ink-200\b/g, 'border-white/[0.08]'],
  [/\bborder-ink-300\b/g, 'border-white/[0.10]'],
  [/\bborder-ink-400\b/g, 'border-white/[0.12]'],
  [/\bborder-ink-500\b/g, 'border-white/[0.14]'],
  [/\bborder-ink-600\b/g, 'border-white/[0.14]'],
  [/\bborder-ink-700\b/g, 'border-white/[0.14]'],
  [/\bborder-ink-800\b/g, 'border-white/[0.08]'],
  [/\bborder-ink-900\b/g, 'border-white/[0.12]'],
  // 6. Divide ink-*
  [/\bdivide-ink-100\b/g, 'divide-white/[0.06]'],
  [/\bdivide-ink-200\b/g, 'divide-white/[0.08]'],
  [/\bdivide-ink-700\b/g, 'divide-white/[0.08]'],
  [/\bdivide-ink-800\b/g, 'divide-white/[0.06]'],
  // 7. Hover equivalents (white/[..] em hover)
  [/\bhover:bg-ink-50\b/g, 'hover:bg-white/[0.04]'],
  [/\bhover:bg-ink-100\b/g, 'hover:bg-white/[0.06]'],
  [/\bhover:bg-ink-200\b/g, 'hover:bg-white/[0.08]'],
  [/\bhover:bg-ink-700\b/g, 'hover:bg-white/[0.08]'],
  [/\bhover:bg-ink-800\b/g, 'hover:bg-white/[0.08]'],
  [/\bhover:bg-ink-900\b/g, 'hover:bg-white/[0.06]'],
  [/\bhover:text-ink-700\b/g, 'hover:text-white'],
  [/\bhover:text-ink-800\b/g, 'hover:text-white'],
  [/\bhover:text-ink-900\b/g, 'hover:text-white'],
  [/\bhover:text-ink-500\b/g, 'hover:text-white/70'],
  // 8. Ring offset no botão (dark) e focus ring já ajustado em globals.css.
  // 9. Cores semânticas para fora (sem cor semântica). Manter red (destrutivo).
  // emerald-500/600, amber-500/600, sky-500/600 → variantes em white/[..] ou
  // brand quando faz sentido.
  [/\btext-emerald-500\b/g, 'text-white'],
  [/\btext-emerald-600\b/g, 'text-white'],
  [/\btext-emerald-700\b/g, 'text-white'],
  [/\btext-emerald-400\b/g, 'text-white'],
  [/\bbg-emerald-500\b/g, 'bg-white/[0.08]'],
  [/\bbg-emerald-600\b/g, 'bg-white/[0.10]'],
  [/\bbg-emerald-50\b/g, 'bg-white/[0.05]'],
  [/\bring-emerald-\d+\b/g, 'ring-white/10'],
  [/\btext-amber-500\b/g, 'text-white/70'],
  [/\btext-amber-600\b/g, 'text-white/70'],
  [/\btext-amber-700\b/g, 'text-white/70'],
  [/\btext-amber-400\b/g, 'text-white/70'],
  [/\bbg-amber-500\b/g, 'bg-white/[0.10]'],
  [/\bbg-amber-600\b/g, 'bg-white/[0.12]'],
  [/\bbg-amber-50\b/g, 'bg-white/[0.05]'],
  [/\bring-amber-\d+\b/g, 'ring-white/10'],
  [/\btext-sky-500\b/g, 'text-white/70'],
  [/\btext-sky-600\b/g, 'text-white/70'],
  [/\btext-sky-700\b/g, 'text-white/70'],
  [/\btext-sky-400\b/g, 'text-white/70'],
  [/\bbg-sky-500\b/g, 'bg-white/[0.10]'],
  [/\bbg-sky-600\b/g, 'bg-white/[0.12]'],
  [/\bbg-sky-50\b/g, 'bg-white/[0.05]'],
  [/\bring-sky-\d+\b/g, 'ring-white/10'],
  // 10. Remove redundâncias após mudanças. NÃO inclui '/' para não
  // destruir '//' de comentário nem paths em URLs/opacidades.
  [/(\s)([a-z0-9\.\[\]_]+)(\s)\2(\s|$)/g, '$1$2$3$4'],
  // 11. Compacta duplicatas de padrões comuns
  [/(\s)bg-white\/\[0\.04\](\s)bg-white\/\[0\.04\](\s|$)/g, '$1bg-white/[0.04]$2$3'],
  [/(\s)text-white\/50(\s)text-white\/50(\s|$)/g, '$1text-white/50$2$3'],
]

let changedCount = 0
for (const file of FILES) {
  let src = fs.readFileSync(file, 'utf8')
  const before = src
  for (const [regex, replacement] of REPLACEMENTS) {
    src = src.replace(regex, replacement)
  }
  if (src !== before) {
    fs.writeFileSync(file, src)
    changedCount++
    console.log('updated', file)
  }
}
console.log(`done: ${changedCount} files changed`)