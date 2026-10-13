// Exercise a future addition in an isolated copy; never add sample work to the real collection.
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { build, preview } from 'vite'
import vue from '@vitejs/plugin-vue'
import { chromium } from 'playwright'
import { prepareCatalogue } from './catalogue.mjs'

const root = resolve(import.meta.dirname, '..')
const qaRoot = resolve(root, 'qa')
mkdirSync(qaRoot, { recursive: true })
const fixture = mkdtempSync(resolve(qaRoot, 'authoring-'))
let browser, server
const checks = []
try {
  for (const directory of ['content', 'src', 'public']) cpSync(resolve(root, directory), resolve(fixture, directory), { recursive: true })
  mkdirSync(resolve(fixture, 'projects'), { recursive: true })
  mkdirSync(resolve(fixture, 'scripts'))
  for (const file of ['scripts/new-project.mjs', 'scripts/catalogue.mjs', 'index.html', 'projects/index.html']) cpSync(resolve(root, file), resolve(fixture, file))
  const categoriesPath = resolve(fixture, 'content/categories.json')
  const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'))
  categories.push({ id: 'qa-future-area', label: 'QA future category', description: 'Isolated test category.', featuredProjectId: null, ideas: ['Test a first published work'] })
  writeFileSync(categoriesPath, JSON.stringify(categories))
  const command = spawnSync(process.execPath, [resolve(fixture, 'scripts/new-project.mjs'), 'qa-new-mobile-project', 'qa-future-area'], { encoding: 'utf8' })
  assert.equal(command.status, 0, command.stderr)
  const projectPath = resolve(fixture, 'content/projects/qa-new-mobile-project.json')
  const draft = JSON.parse(readFileSync(projectPath, 'utf8'))
  assert.equal(draft.status, 'draft')
  const initialEntries = prepareCatalogue(fixture)
  assert(!initialEntries['project-qa-new-mobile-project'])
  assert(!readFileSync(resolve(fixture, 'src/data/catalogue.json'), 'utf8').includes('qa-new-mobile-project'))
  const duplicate = spawnSync(process.execPath, [resolve(fixture, 'scripts/new-project.mjs'), 'qa-new-mobile-project', 'qa-future-area'], { encoding: 'utf8' })
  assert.notEqual(duplicate.status, 0)
  checks.push('Scaffold creates a hidden draft and refuses to overwrite it')

  const project = {
    ...draft, status: 'published', title: 'QA fixture: mobile inspection', publishedAt: '2026-10-10', updatedAt: '2026-10-10',
    summary: 'Temporary test content used only in this isolated build.', technologies: ['Android'], tags: ['Offline'], proof: 'Authoring pipeline smoke test',
    cover: { src: '/media/device-diagnostics-cover.svg', alt: 'Reused illustration in an isolated QA fixture', fit: 'contain' },
    links: [{ label: 'Fixture evidence', href: '/evidence/normal-report.json' }],
    caseStudy: { role: 'Temporary QA fixture', context: 'This is not a portfolio project.', sections: [{ heading: 'Test section', paragraphs: ['A newly created standard case renders without writing a Vue component.'], bullets: ['Structured content reaches the page.'] }], limitations: ['Not a completed mobile application.'] },
  }
  writeFileSync(projectPath, JSON.stringify(project, null, 2))
  const entries = prepareCatalogue(fixture)
  assert.equal(Object.keys(entries).length, Object.keys(initialEntries).length + 1)
  await build({ root: fixture, configFile: false, plugins: [vue()], logLevel: 'warn', build: { rolldownOptions: { input: entries } } })
  server = await preview({ root: fixture, configFile: false, logLevel: 'warn', preview: { host: '127.0.0.1', port: 0 } })
  const address = server.httpServer.address()
  const base = `http://127.0.0.1:${address.port}`
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(base)
  assert.equal(await page.locator('.featured-grid [data-category="qa-future-area"]').count(), 1)
  await page.getByRole('link', { name: 'View case study: QA fixture: mobile inspection', exact: true }).click()
  assert.equal(await page.locator('h1').innerText(), project.title)
  assert(await page.getByRole('heading', { name: 'Test section', exact: true }).isVisible())
  assert.match(await page.locator('.standard-case').innerText(), /Structured content reaches the page/)
  assert.match(await page.locator('.standard-case').innerText(), /Not a completed mobile application/)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.equal((await page.request.get(base + '/evidence/normal-report.json')).status(), 200)
  await page.screenshot({ path: resolve(qaRoot, 'standard-case-mobile.png'), fullPage: true })
  checks.push('Publishing the first work in a new category automatically adds a homepage card and working static case route')
  checks.push('Generic case renders role, sections, bullets, limitations and evidence at mobile width')
  await page.getByRole('link', { name: 'All qa future category projects', exact: true }).click()
  assert.equal(await page.locator('.library-grid [data-project="qa-new-mobile-project"]').count(), 1)
  assert.equal(await page.getByRole('button', { name: /^QA future category/ }).getAttribute('aria-pressed'), 'true')
  assert(!(await page.locator('.future-grid').allTextContents()).join(' ').includes('QA future category'))
  checks.push('Newly active category filters correctly and leaves the future-only area')
  writeFileSync(projectPath, JSON.stringify({ ...project, status: 'archived' }))
  const archivedEntries = prepareCatalogue(fixture)
  assert(!archivedEntries['project-qa-new-mobile-project'])
  assert(!existsSync(resolve(fixture, 'projects/qa-new-mobile-project/index.html')))
  assert(!readFileSync(resolve(fixture, 'src/data/catalogue.json'), 'utf8').includes('qa-new-mobile-project'))
  checks.push('Archiving removes the generated detail entry and public catalogue record')
  assert.deepEqual(errors, [])
  writeFileSync(resolve(qaRoot, 'authoring-results.json'), JSON.stringify({ executed_at_utc: new Date().toISOString(), browser: await browser.version(), checks, scope: 'Isolated content copy and production build; fixture removed after execution. No real work or remote publication added.' }, null, 2) + '\n')
  console.log(`${checks.length} authoring lifecycle checks passed`)
} finally {
  if (browser) await browser.close()
  if (server) await server.close()
  const checked = resolve(fixture)
  assert(checked.startsWith(qaRoot + sep + 'authoring-'))
  rmSync(checked, { recursive: true, force: true })
}
