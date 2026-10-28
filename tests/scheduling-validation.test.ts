import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkSchedule, calculateValidatedMetrics, getValidationCase } from '../src/lib/scheduling-validation.ts'

test('valid example calculates waiting only after passing every independent constraint', () => {
  const example = getValidationCase('valid')
  assert.deepEqual(checkSchedule(example.jobs, example.slots), [])
  assert.deepEqual(calculateValidatedMetrics(example.jobs, example.slots), { mean_wait_min: 3, max_wait_min: 6, finish_min: 8, constraint_violations: 0 })
  assert.deepEqual(calculateValidatedMetrics([], []), { mean_wait_min: 0, max_wait_min: 0, finish_min: 0, constraint_violations: 0 })
})

test('each deliberate corruption blocks metrics with the actual source violation codes', () => {
  for (const [id, codes] of [['gap', ['overlap_or_missing_gap']], ['release', ['before_release']], ['duplicate', ['duplicate_job', 'missing_jobs']]] as const) {
    const example = getValidationCase(id)
    assert.deepEqual(checkSchedule(example.jobs, example.slots), codes)
    assert.throws(() => calculateValidatedMetrics(example.jobs, example.slots), /Infeasible schedule/)
  }
})

test('unknown, invalid-time, duration and coverage checks cannot be bypassed', () => {
  const jobs = [{ id: 'a', release: 0, duration: 4 }]
  for (const [slots, code] of [
    [[{ job_id: 'other', start: 0, end: 4 }], 'unknown_job'],
    [[{ job_id: 'a', start: false, end: 4 }], 'invalid_time'],
    [[{ job_id: 'a', start: 0, end: 3 }], 'wrong_duration'],
    [[], 'missing_jobs'],
  ] as const) {
    assert(checkSchedule(jobs, slots).includes(code))
    assert.throws(() => calculateValidatedMetrics(jobs, slots), /Infeasible schedule/)
  }
  assert.throws(() => checkSchedule([{ id: 'a', release: 0, duration: true }], []), /integer minutes/)
  assert.throws(() => checkSchedule([{ id: 'a', release: 0, duration: 4 }, { id: 'a', release: 0, duration: 4 }], []), /unique/)
  assert.throws(() => checkSchedule(jobs, [], -1), /Gap/)
})

test('all 44 saved timelines independently reproduce the recorded waiting metrics', () => {
  const read = (name: string) => JSON.parse(readFileSync(new URL(`../public/evidence/scheduling-${name}.json`, import.meta.url), 'utf8'))
  const inputs = read('inputs'), timelines = read('timelines'), results = read('results')
  assert.equal(timelines.length, 44)
  for (const timeline of timelines) {
    const jobs = inputs.find((input: any) => input.name === timeline.scenario).jobs
    const recorded = results.rows.find((row: any) => row.scenario === timeline.scenario && row.policy === timeline.policy)
    const actual = calculateValidatedMetrics(jobs, timeline.slots, results.gap_minutes)
    assert.deepEqual(actual, { mean_wait_min: recorded.mean_wait_min, max_wait_min: recorded.max_wait_min, finish_min: recorded.finish_min, constraint_violations: 0 })
  }
})
