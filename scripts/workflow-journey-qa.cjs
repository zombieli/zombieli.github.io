const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const base = process.env.BASE_URL || 'http://127.0.0.1:4174'

;(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const checks = [], errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(6000)
  fs.mkdirSync('qa/workflow-journey', { recursive: true })
  try {
    assert.equal((await page.goto(base + '/projects/field-service/')).status(), 200)
    const map = page.getByTestId('workflow-journey-map')
    await map.waitFor()
    const stages = ['scope', 'lifecycle', 'services', 'write-safety', 'verification', 'delivery']
    assert.equal(await map.locator('button[data-stage]').count(), 6)
    for (const id of stages) assert.equal(await page.locator(`nav[aria-label="Build journey"] a[href="#${id}"]`).count(), 1)
    await map.locator('[data-stage="lifecycle"]').click()
    assert.match(await map.getByTestId('workflow-map-artifact').innerText(), /contract\.json/)
    await map.locator('[data-stage="delivery"]').focus()
    await page.keyboard.press('Enter')
    assert.equal(await map.getByRole('link', { name: 'Explore this stage' }).getAttribute('href'), '#delivery')
    checks.push('Six real development stages, clickable artifacts and keyboard chapter links')

    const modes = page.getByTestId('workflow-services')
    await modes.getByRole('button', { name: 'Local API', exact: true }).click()
    assert.match(await modes.getByTestId('service-mode-detail').innerText(), /SQLite/)
    await modes.getByRole('button', { name: 'Browser demo', exact: true }).focus()
    await page.keyboard.press('Enter')
    assert.match(await modes.getByTestId('service-mode-detail').innerText(), /refresh/i)
    checks.push('Service diagram distinguishes session-only demo from persisted API mode')

    const life = page.getByTestId('workflow-lifecycle')
    const status = () => life.locator('[data-current-status]').innerText()
    const version = () => life.locator('[data-order-version]').innerText()
    const count = () => life.locator('[data-history-count]').innerText()
    await life.locator('button[data-state="Closed"]').click()
    assert.equal(await status(), 'Open')
    await life.getByLabel('Next status', { exact: true }).selectOption('Closed')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    assert.equal(await status(), 'Open')
    assert.equal(await count(), '1')
    await life.getByLabel('Next status', { exact: true }).selectOption('Assigned')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    assert.equal(await status(), 'Open')
    assert.equal(await version(), '1')
    await life.getByLabel('Technician label', { exact: true }).fill('Alex')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    assert.equal(await status(), 'Assigned')
    await life.getByLabel('Next status', { exact: true }).selectOption('In Progress')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    await life.getByLabel('Next status', { exact: true }).selectOption('Resolved')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    assert.equal(await status(), 'In Progress')
    await life.getByLabel('Treatment note', { exact: true }).fill('Replaced the synthetic sensor connector.')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    assert.equal(await status(), 'Resolved')
    await life.getByLabel('Next status', { exact: true }).selectOption('Open')
    await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    assert.equal(await status(), 'Open')
    assert.equal(await version(), '5')
    assert.equal(await count(), '5')
    assert.equal(await life.locator('[data-current-assignee]').innerText(), 'Not assigned')
    assert.equal(await life.locator('[data-current-resolution]').innerText(), 'No current note')
    assert.match(await life.innerText(), /Replaced the synthetic sensor connector\./)
    checks.push('Lifecycle gates block incomplete changes; reopen preserves five versioned history entries')
    await life.getByRole('button', { name: 'Reset example', exact: true }).click()
    assert.equal(await version(), '1')
    assert.equal(await count(), '1')
    for (const next of ['Assigned', 'In Progress', 'Resolved', 'Closed']) {
      await life.getByLabel('Next status', { exact: true }).selectOption(next)
      if (next === 'Assigned') await life.getByLabel('Technician label', { exact: true }).fill('Alex')
      if (next === 'Resolved') await life.getByLabel('Treatment note', { exact: true }).fill('Synthetic repair complete.')
      await life.getByRole('button', { name: 'Apply change', exact: true }).click()
    }
    assert.equal(await status(), 'Closed')
    assert.equal(await count(), '5')
    assert.equal(await life.getByRole('button', { name: 'Apply change', exact: true }).isEnabled().catch(() => false), false)
    checks.push('Reset clears only the example and Closed is terminal')

    const safety = page.getByTestId('workflow-write-safety')
    const flow = page.getByTestId('write-flow')
    const committed = async () => ({
      version: await safety.locator('[data-committed-version]').innerText(),
      events: await safety.locator('[data-committed-events]').innerText(),
      status: await safety.locator('[data-committed-status]').innerText(),
    })
    await flow.getByRole('button', { name: 'Replay flow', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[data-testid="write-flow"]').dataset.playing === 'false', null, { timeout: 10000 })
    assert.deepEqual(await committed(), { version: '2', events: '2', status: 'Assigned' })
    for (const [scenario, expected] of [
      ['Accepted write', { version: '2', events: '2', status: 'Assigned' }],
      ['Stale version', { version: '2', events: '2', status: 'Assigned' }],
      ['Event insert failure', { version: '1', events: '1', status: 'Open' }],
    ]) {
      await safety.getByRole('button', { name: scenario, exact: true }).click()
      if (scenario === 'Accepted write') {
        await flow.locator('button[data-write-step="history"]').click()
        assert.deepEqual(await committed(), { version: '1', events: '1', status: 'Open' })
      }
      await flow.locator('button[data-write-step]').last().click()
      assert.deepEqual(await committed(), expected)
      assert.equal(await flow.getAttribute('data-playing'), 'false')
    }
    checks.push('Commit, conflict and rollback preserve the correct durable record and history')
    await flow.getByRole('button', { name: 'Replay flow', exact: true }).click()
    assert.equal(await flow.getAttribute('data-playing'), 'true')
    await flow.getByRole('button', { name: 'Pause flow', exact: true }).click()
    assert.equal(await flow.getAttribute('data-playing'), 'false')
    await flow.getByRole('button', { name: 'Replay flow', exact: true }).click()
    await safety.getByRole('button', { name: 'Stale version', exact: true }).click()
    await flow.locator('button[data-write-step]').last().click()
    await page.waitForTimeout(1300)
    assert.deepEqual(await committed(), { version: '2', events: '2', status: 'Assigned' })
    assert.match(await flow.innerText(), /409|version_conflict/)
    checks.push('Playback pauses and scenario switching cancels the previous transaction')

    await flow.getByRole('button', { name: 'Replay flow', exact: true }).click()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => document.querySelector('[data-testid="write-flow"]').dataset.playing === 'false')
    await safety.getByRole('button', { name: 'Accepted write', exact: true }).click()
    await flow.getByRole('button', { name: 'Replay flow', exact: true }).click()
    assert.equal(await flow.getAttribute('data-playing'), 'false')
    await flow.locator('button[data-write-step]').last().focus()
    await page.keyboard.press('Enter')
    assert.deepEqual(await committed(), { version: '2', events: '2', status: 'Assigned' })
    await map.locator('[data-stage="services"]').click()
    await modes.getByRole('button', { name: 'Local API', exact: true }).click()
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0)
    checks.push('Reduced motion stops active playback and preserves keyboard step exploration')

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const [name, locator] of [['map', map], ['lifecycle', life], ['services', modes], ['write-safety', safety]]) {
        await locator.scrollIntoViewIfNeeded()
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: overflow at ${width}`)
        await page.screenshot({ path: `qa/workflow-journey/${name}-${width}.png` })
      }
    }
    checks.push('Four diagrams fit at 320, 390, 768 and 1440 CSS pixels')
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.locator('nav[aria-label="Build journey"] a[href="#delivery"]').click()
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Build journey"] a[href="#delivery"]')?.getAttribute('aria-current') === 'step')
    for (const path of ['/evidence/workflow-contract.json', '/evidence/workflow-design.md', '/evidence/workflow-development.md', '/evidence/workflow-browser-results.json', '/downloads/field-service-workflow.zip', '/field-service-workflow/']) assert.equal((await page.request.get(base + path)).status(), 200, path)
    assert.deepEqual(errors, [])
    checks.push('Chapter tracking, supporting artifacts and original demo remain available; no page errors')
    fs.writeFileSync('qa/workflow-journey/results.json', JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2) + '\n')
    console.log(`${checks.length} workflow journey checks passed`)
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
