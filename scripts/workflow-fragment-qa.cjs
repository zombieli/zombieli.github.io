const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const base = process.env.BASE_URL || 'http://127.0.0.1:4174'
;(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const checks = []
  try {
    const chunk = fs.readdirSync('dist/assets').find(name => /^WorkflowCase-.*\.js$/.test(name))
    assert(chunk)
    for (const target of ['workflow-build-map', 'write-safety']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      let requests = 0
      await page.route(`${base}/assets/${chunk}`, async route => {
        requests++
        const response = await route.fetch()
        await new Promise(resolve => setTimeout(resolve, 750))
        await route.fulfill({ response })
      })
      await page.goto(`${base}/projects/field-service/#${target}`)
      await page.getByTestId('workflow-journey-map').waitFor()
      assert.equal(requests, 1)
      await page.waitForFunction(id => {
        const element = document.getElementById(id)
        return element && scrollY > 0 && element.getBoundingClientRect().top >= 0 && element.getBoundingClientRect().top < innerHeight / 2
      }, target, { timeout: 5000 })
      checks.push(`Cold link #${target} restores after the delayed page component`)
      await page.close()
    }
    fs.mkdirSync('qa/workflow-journey', { recursive: true })
    fs.writeFileSync('qa/workflow-journey/fragments.json', JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2) + '\n')
    console.log(`${checks.length} workflow fragment checks passed`)
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
