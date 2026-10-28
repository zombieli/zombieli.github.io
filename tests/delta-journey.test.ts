import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compareReports } from '../src/lib/delta-core.mjs'
import { policyScenario, createReadState, beginRead, settleRead, raceFrames } from '../src/lib/delta-journey.ts'
const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const baseline = json('../src/data/delta-baseline.json'), candidate = json('../src/data/delta-candidate.json')

test('shared core and both inputs match the original demo; comparison exactly reproduces the saved artifact', () => {
  const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n')
  assert.equal(source('../src/lib/delta-core.mjs'), source('../public/demos/test-report-delta/core.mjs'))
  assert.deepEqual(baseline, json('../public/demos/test-report-delta/samples/baseline.json'))
  assert.deepEqual(candidate, json('../public/demos/test-report-delta/samples/candidate.json'))
  assert.deepEqual(compareReports(baseline, candidate), json('../public/evidence/test-report-delta-sample.json'))
})
test('coverage overrides cannot accept failures or empty candidates', () => {
  for (const name of ['sample', 'added-failure', 'empty'] as const) {
    const pair = policyScenario(name, baseline, candidate)
    const result = compareReports(pair.baseline, pair.candidate, { allowRemoved: true, allowSkipped: true })
    assert.equal(result.verdict, name === 'empty' ? 'incomplete' : 'fail')
  }
  const pair = policyScenario('coverage', baseline, candidate)
  assert.equal(compareReports(pair.baseline, pair.candidate).verdict, 'incomplete')
  assert.equal(compareReports(pair.baseline, pair.candidate, { allowRemoved: true }).verdict, 'incomplete')
  assert.equal(compareReports(pair.baseline, pair.candidate, { allowRemoved: true, allowSkipped: true }).verdict, 'pass')
})
test('timing requires both strict thresholds, handles zeros and remains advisory', () => {
  for (const [before, after, expected] of [[200, 300, 'stable'], [200, 301, 'slower'], [1000, 1101, 'stable'], [1, 50, 'stable'], [0, 100, 'stable'], [0, 101, 'slower'], [0, 0, 'stable'], [450, 100, 'faster']] as const) {
    const pair = policyScenario('timing', baseline, candidate, before, after)
    const result = compareReports(pair.baseline, pair.candidate)
    assert.equal(result.rows[0].timing, expected)
    assert.equal(result.verdict, 'pass')
    if (before === 0) assert.equal(result.rows[0].ratio, null)
  }
})
test('exact pair matching avoids delimiter collisions and rejects duplicate identities', () => {
  const cases = [{ suite: 'A:B', name: 'C', status: 'passed', durationMs: 1 }, { suite: 'A', name: 'B:C', status: 'passed', durationMs: 1 }]
  const report = { schemaVersion: 1, cases }
  assert.equal(compareReports(report, report).rows.length, 2)
  assert.throws(() => compareReports(report, { schemaVersion: 1, cases: [cases[0], cases[0]] }), /duplicate/)
})
test('replacement immediately clears accepted results; an obsolete success cannot restore acceptance', () => {
  const report = { schemaVersion: 1, cases: [{ suite: 'A', name: 'B', status: 'passed', durationMs: 10 }] }
  let state = createReadState(report, report)
  assert.equal(state.result?.verdict, 'pass')
  state = beginRead(state, 'candidate')
  const old = state.tokens.candidate
  assert.equal(state.result, null)
  state = beginRead(state, 'candidate')
  state = settleRead(state, 'candidate', state.tokens.candidate, '{ malformed')
  assert.match(state.errors.candidate, /Malformed JSON/)
  const rejected = state
  state = settleRead(state, 'candidate', old, JSON.stringify(report))
  assert.equal(state, rejected)
  assert.equal(state.result, null)
})
test('per-slot tokens let an untouched baseline finish while ignoring replaced sample candidate success or error', () => {
  const frames = raceFrames('independent')
  const final = frames.at(-1)!.state
  assert.equal(final.result?.verdict, 'pass')
  assert.equal(final.reports.baseline?.label, 'Sample baseline')
  assert.equal(final.reports.candidate?.label, 'New candidate')
  assert.equal(settleRead(final, 'candidate', 1, '{ malformed'), final)
  assert.equal(final.loading.baseline, false)
})
