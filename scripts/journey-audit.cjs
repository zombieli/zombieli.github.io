const { chromium } = require('playwright')
const fs = require('node:fs')
const assert = require('node:assert/strict')
const base = process.env.BASE_URL || 'http://127.0.0.1:4174'
const routes = ['device-diagnostics', 'field-service', 'scheduling', 'inspection-notebook', 'test-report-delta', 'technical-manual-search']
const anchors = ['build-map', 'workflow-build-map', 'scheduling-build-map', 'inspection-build-map', 'delta-build-map', 'manual-build-map']
;(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH })
  const page = await browser.newPage()
  const results = [], errors = [], checks = []
  page.on('pageerror', error => errors.push(error.message))
  fs.mkdirSync('qa/consistency', { recursive: true })
  try {
    for (const width of [1440, 390, 320, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 900 })
      for (const route of routes) {
        await page.goto(`${base}/projects/${route}/`)
        await page.locator('button[data-stage]').first().waitFor()
        await page.waitForTimeout(250)
        const layout = await page.evaluate(() => {
          const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'
          const label = el => (el.getAttribute('aria-label') || el.textContent || el.id).trim().slice(0, 80)
          const controls = [...document.querySelectorAll('button, summary, input, select, textarea')].filter(visible)
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            smallTargets: controls.filter(el => !el.matches('input[type="checkbox"],input[type="radio"]') && (el.getBoundingClientRect().height < 43.5 || el.getBoundingClientRect().width < 43.5)).map(el => ({ label: label(el), class: el.className, height: el.getBoundingClientRect().height })),
            smallFields: controls.filter(el => el.matches('input:not([type="checkbox"]):not([type="radio"]),select,textarea') && parseFloat(getComputedStyle(el).fontSize) < 16).map(el => ({ label: label(el), font: getComputedStyle(el).fontSize })),
            brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(el => el.hash.length > 1 && !document.getElementById(decodeURIComponent(el.hash.slice(1)))).map(el => el.hash),
            duplicateIds: [...document.querySelectorAll('[id]')].map(el => el.id).filter((id, i, all) => all.indexOf(id) !== i),
            initialAnimation: document.getAnimations().filter(a => a.playState === 'running').length,
          }
        })
        if (width === 390) {
          await page.locator('button[data-stage]').first().scrollIntoViewIfNeeded()
          await page.screenshot({ path: `qa/consistency/${route}-mobile.png` })
        }
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.locator('button[data-stage]').nth(2).click()
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await page.waitForTimeout(80)
        layout.replayedAfterPreference = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a instanceof CSSAnimation).map(a => a.animationName))
        results.push({ route, width, ...layout })
      }
    }
    const issues = results.filter(r => r.overflow || r.smallTargets.length || (r.width <= 1000 && r.smallFields.length) || r.brokenAnchors.length || r.duplicateIds.length || r.initialAnimation || r.replayedAfterPreference.length)
    fs.writeFileSync('qa/consistency/audit.json', JSON.stringify({ results, errors, issues }, null, 2))
    assert.deepEqual(issues, [], 'Layout, touch targets, initial motion and preference changes must pass on every route and width')
    checks.push('All six projects pass at 320, 390, 844 and 1440 px: no overflow, small controls, duplicate IDs, broken fragments or unexpected animation')

    await page.setViewportSize({ width: 1440, height: 1000 })
    for (const [routeIndex, route] of routes.entries()) {
      await page.goto(`${base}/projects/${route}/#${anchors[routeIndex]}`)
      const nodes = page.locator('button[data-stage]')
      await nodes.first().waitFor()
      await page.waitForFunction(id => Math.abs(document.getElementById(id)?.getBoundingClientRect().top ?? 9999) < 60, anchors[routeIndex])
      for (let i = 0; i < 6; i++) {
        const node = nodes.nth(i)
        await node.focus()
        await page.keyboard.press(i % 2 ? 'Space' : 'Enter')
        assert.equal(await node.getAttribute('aria-pressed'), 'true')
        assert.equal(await node.evaluate(el => el === document.activeElement), true, 'Selecting a map node must retain keyboard focus')
        assert.notEqual(await node.evaluate(el => getComputedStyle(el).outlineStyle), 'none')
      }
      await page.waitForTimeout(750)
      assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0)
      // Capture stable IDs: filtering by "Replay" would lose the container as soon as its label becomes "Pause".
      const ids = await page.locator('[data-playing]').filter({ has: page.getByRole('button', { name: /^Replay / }) }).evaluateAll(elements => elements.map(el => el.dataset.testid))
      const scopes = ids.map(id => page.getByTestId(id))
      assert.ok(scopes.length >= 1)
      const state = scope => scope.evaluate(el => [...el.querySelectorAll('[aria-current="step"],[aria-pressed="true"]')].map(node => node.textContent).join('|'))
      const paused = []
      for (const scope of scopes) {
        assert.equal(await scope.getAttribute('data-playing'), 'false')
        const button = scope.getByRole('button', { name: /^Replay / })
        await button.click()
        await scope.getByRole('button', { name: /^Pause / }).waitFor()
        assert.equal(await scope.getAttribute('data-playing'), 'true', `${route}/${await scope.getAttribute('data-testid')}: ${JSON.stringify(await page.evaluate(() => ({ hidden: document.hidden, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches })))}`)
        await scope.getByRole('button', { name: /^Pause / }).click()
        await scope.getByRole('button', { name: /^Replay / }).waitFor()
        paused.push(await state(scope))
      }
      await page.waitForTimeout(1300)
      for (const [i, scope] of scopes.entries()) assert.equal(await state(scope), paused[i], 'Pause must cancel later steps')
      for (const scope of scopes) await scope.getByRole('button', { name: /^Replay / }).click()
      await page.waitForTimeout(1300)
      for (const [i, scope] of scopes.entries()) assert.notEqual(await state(scope), paused[i], 'Explicit replay must advance to the next step')
      // Exercise the visibility handler deterministically; no wall-clock background throttling assumption.
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
      for (const scope of scopes) assert.equal(await scope.getAttribute('data-playing'), 'false')
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
      for (const scope of scopes) {
        assert.equal(await scope.getAttribute('data-playing'), 'false')
        await scope.getByRole('button', { name: /^Replay / }).click()
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.waitForFunction(() => [...document.querySelectorAll('[data-playing]')].every(el => el.dataset.playing === 'false'))
      for (const scope of scopes) { await scope.getByRole('button', { name: /^Replay / }).click(); assert.equal(await scope.getAttribute('data-playing'), 'false') }
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      for (const scope of scopes) assert.equal(await scope.getAttribute('data-playing'), 'false')
      checks.push(`${route}: six keyboard nodes retain focus; all ${scopes.length} walkthroughs replay, pause, stop in background/reduced motion and never auto-resume`)
    }

    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    phone.on('pageerror', error => errors.push(error.message))
    const examples = ['retry-decision', 'workflow-write-safety', 'scheduling-dispatch', 'inspection-record-demo', 'delta-comparison', 'manual-ranking']
    for (const [i, route] of routes.entries()) {
      await phone.goto(`${base}/projects/${route}/`)
      const nodes = phone.locator('button[data-stage]')
      await nodes.first().waitFor()
      await nodes.nth(2).tap()
      assert.equal(await nodes.nth(2).getAttribute('aria-pressed'), 'true')
      await phone.waitForTimeout(750)
      await nodes.first().evaluate(el => el.closest('section').scrollIntoView())
      await phone.screenshot({ path: `qa/consistency/${route}-phone-map.png` })
      await phone.getByTestId(examples[i]).evaluate(el => el.scrollIntoView())
      await phone.screenshot({ path: `qa/consistency/${route}-phone-demo.png` })
      assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    }
    checks.push('All six support touch selection in a mobile browser context; map and demo viewport screenshots captured')
    await phone.goto(base)
    await phone.getByRole('heading', { level: 1 }).waitFor()
    await phone.screenshot({ path: 'qa/consistency/home-phone.png' })
    await page.goto(base)
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.screenshot({ path: 'qa/consistency/home-desktop.png' })
    assert.deepEqual(errors, [])
    fs.writeFileSync('qa/consistency/results.json', JSON.stringify({ checks, errors, viewports: results.length }, null, 2))
    console.log(JSON.stringify({ passed: checks.length, viewports: results.length, errors }, null, 2))
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exit(1) })
