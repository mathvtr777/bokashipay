/**
 * Teste end-to-end pela UI real: cria uma conta, faz login e percorre as
 * páginas, tirando screenshot de cada uma.
 *
 * Uso: npx tsx scripts/e2e.ts
 */
import puppeteer, { type Page } from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = '/tmp/bokashi-shots'
mkdirSync(OUT, { recursive: true })

const EMAIL = `e2e.${Date.now()}@gmail.com`
const PASSWORD = 'SenhaTeste123'
const FULL_NAME = 'Cliente E2E'

const log = (msg: string) => console.log(`  ${msg}`)

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  log(`screenshot: ${name}.png`)
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err: unknown) =>
    errors.push(`pageerror: ${err instanceof Error ? err.message : String(err)}`),
  )

  try {
    // ---- Cadastro -------------------------------------------------------
    console.log('\nCadastro')
    await page.goto(`${BASE}/register`, { waitUntil: 'networkidle2' })
    await shot(page, '01-register')

    await page.type('input[autocomplete="name"]', FULL_NAME)
    await page.type('input[type="email"]', EMAIL)
    await page.type('input[autocomplete="tel"]', '11988887777')

    const passwords = await page.$$('input[type="password"]')
    await passwords[0].type(PASSWORD)
    await passwords[1].type(PASSWORD)

    // Checkbox dos termos
    await page.click('input[type="checkbox"]')
    await shot(page, '02-register-preenchido')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ])

    const afterRegister = page.url()
    log(`url após cadastro: ${afterRegister}`)

    // ---- Login (caso o cadastro tenha redirectionado) ---------------------
    if (!afterRegister.includes('/dashboard')) {
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
      await page.type('input[type="email"]', EMAIL)
      const pw = await page.$$('input[type="password"]')
      await pw[0].type(PASSWORD)

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ])
      log(`url após login: ${page.url()}`)
    }

    // ---- Percorre as páginas --------------------------------------------
    console.log('\nPáginas autenticadas')
    const pages = [
      ['/dashboard', '03-dashboard'],
      ['/vendas', '04-vendas'],
      ['/pix', '05-pix'],
      ['/financeiro', '06-financeiro'],
      ['/contas-bancarias', '07-contas'],
      ['/saques-cripto', '08-saques'],
      ['/integracoes', '09-integracoes'],
      ['/clientes', '10-clientes'],
      ['/configuracoes', '11-configuracoes'],
      ['/perfil', '12-perfil'],
      ['/ajuda', '13-ajuda'],
    ]

    for (const [route, name] of pages) {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' })
      const status = response?.status() ?? 0
      log(`${route} -> ${status} ${page.url().replace(BASE, '')}`)
      await shot(page, name)
    }

    // ---- Responsivo ------------------------------------------------------
    console.log('\nResponsivo')
    await page.setViewport({ width: 390, height: 844, isMobile: true })
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' })
    await shot(page, '14-mobile-dashboard')

    await page.setViewport({ width: 820, height: 1180, isMobile: false })
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' })
    await shot(page, '15-tablet-dashboard')

    // ---- Erros de console ------------------------------------------------
    console.log('\nErros de console')
    const relevant = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('Download the React DevTools'),
    )
    if (relevant.length === 0) log('nenhum')
    else relevant.slice(0, 15).forEach((e) => log(e))

    console.log(`\nConta criada: ${EMAIL}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error('FALHA:', error.message)
  process.exit(1)
})