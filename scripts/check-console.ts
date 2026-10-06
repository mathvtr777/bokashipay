import puppeteer from 'puppeteer-core'

/**
 * Carrega uma URL num navegador real e reporta erros de console/rede.
 * Existe porque uma CSP restritiva passa no build e quebra na hora — só o
 * navegador de verdade revela um bloqueio de script.
 *
 * Uso: npx tsx scripts/check-console.ts [url]
 */
const URL_TO_CHECK = process.argv[2] ?? 'http://localhost:3000/login'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  const problems: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error: unknown) => {
    problems.push(`pageerror: ${error instanceof Error ? error.message : String(error)}`)
  })
  page.on('requestfailed', (request) => {
    problems.push(`request falhou: ${request.url()}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      problems.push(`HTTP ${response.status()} ${response.url()}`)
    }
  })

  await page.goto(URL_TO_CHECK, { waitUntil: 'networkidle2' })

  // Confere que a página realmente renderizou, e não ficou em branco.
  const text = await page.evaluate(() => document.body.innerText.trim())
  const rendered = text.length > 0

  console.log(`url: ${URL_TO_CHECK}`)
  console.log(`renderizou: ${rendered ? `sim (${text.length} chars)` : 'NÃO — página em branco'}`)

  if (problems.length === 0) {
    console.log('nenhum erro de console/rede')
  } else {
    console.log('problemas:')
    for (const problem of [...new Set(problems)].slice(0, 12)) console.log('  - ' + problem)
  }

  await browser.close()
}

main()