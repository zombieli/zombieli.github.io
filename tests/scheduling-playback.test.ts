import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { recordedPlayback, getDispatchContext } from '../src/lib/scheduling-playback.ts'

const read = (name: string) => JSON.parse(readFileSync(new URL(`../public/evidence/scheduling-${name}.json`, import.meta.url), 'utf8'))

test('the replay is an exact subset of saved inputs, timelines and results', () => {
  const inputs = read('inputs'), timelines = read('timelines'), results = read('results')
  assert.equal(recordedPlayback.source_sha256, results.source_sha256)
  assert.equal(recordedPlayback.executed_at_utc, results.executed_at_utc)
  for (const scenario of recordedPlayback.scenarios) {
    assert.deepEqual(scenario.jobs, inputs.find((item: any) => item.name === scenario.name).jobs)
    for (const policy of ['fcfs', 'spt'] as const) {
      assert.deepEqual(scenario.policies[policy].slots, timelines.find((item: any) => item.scenario === scenario.name && item.policy === policy).slots)
      assert.deepEqual(scenario.policies[policy].metrics, results.rows.find((item: any) => item.scenario === scenario.name && item.policy === policy))
    }
  }
})

test('every recorded dispatch selects the first ready job under its actual policy without future information', () => {
  for (const scenario of recordedPlayback.scenarios) for (const policy of ['fcfs', 'spt'] as const) {
    const slots = scenario.policies[policy].slots
    slots.forEach((slot, index) => {
      const context = getDispatchContext(scenario, policy, index)
      const done = new Set(slots.slice(0, index).map(item => item.job_id))
      assert.equal(context.ready[0].id, slot.job_id)
      assert(context.ready.every(job => job.release <= slot.start && !done.has(job.id)))
      assert(context.future.every(job => job.release > slot.start && !done.has(job.id)))
      assert.equal(context.ready.length + context.future.length, scenario.jobs.length - index)
      assert.equal(context.wait, slot.start - context.job.release)
      assert.equal(slot.end - slot.start, context.job.duration)
      assert(slot.start >= context.availableAt)
    })
  }
})

test('the same long job moves from zero waiting to minute 93 under SPT', () => {
  const scenario = recordedPlayback.scenarios.find(item => item.name === 'steady-short-arrivals')!
  const first = getDispatchContext(scenario, 'fcfs', 0)
  const last = getDispatchContext(scenario, 'spt', 31)
  assert.equal(first.job.id, 'long-job')
  assert.equal(first.wait, 0)
  assert.equal(first.ready.length, 2)
  assert.equal(first.future.length, 30)
  assert.equal(last.job.id, 'long-job')
  assert.equal(last.wait, 93)
  assert.equal(last.slot.end, 118)
  assert.equal(last.future.length, 0)
})

test('sparse dispatch shows idle time after changeover without adding another gap or a trailing gap', () => {
  const scenario = recordedPlayback.scenarios.find(item => item.name === 'sparse-arrivals')!
  const first = getDispatchContext(scenario, 'fcfs', 0)
  const second = getDispatchContext(scenario, 'fcfs', 1)
  const last = getDispatchContext(scenario, 'fcfs', 11)
  assert.equal(first.slot.start, 0)
  assert.equal(first.availableAt, 0)
  assert.equal(second.availableAt, 12)
  assert.equal(second.idleMinutes, 28)
  assert.equal(second.slot.start, 40)
  assert.equal(second.wait, 0)
  assert.equal(last.slot.end, scenario.policies.fcfs.metrics.finish_min)
  assert.deepEqual(scenario.policies.fcfs.slots, scenario.policies.spt.slots)
})
