import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getWriteScenario } from '../src/lib/workflow-write-safety.ts'

test('an accepted change becomes committed only when its history commits too', () => {
  const scenario = getWriteScenario('accepted')
  for (const step of scenario.steps.slice(0, -1)) {
    assert.deepEqual(step.committed, { status: 'Open', version: 1, events: 1 })
  }
  const updated = scenario.steps.find(step => step.id === 'update')!
  assert.deepEqual(updated.pending, { status: 'Assigned', version: 2, events: 1 })
  const history = scenario.steps.find(step => step.id === 'history')!
  assert.deepEqual(history.pending, { status: 'Assigned', version: 2, events: 2 })
  const committed = scenario.steps.at(-1)!
  assert.equal(committed.id, 'commit')
  assert.deepEqual(committed.committed, { status: 'Assigned', version: 2, events: 2 })
  assert.equal(committed.pending, null)
})

test('a stale request rejects before an update and preserves the newer record and history', () => {
  const scenario = getWriteScenario('stale')
  assert.equal(scenario.request.expectedVersion, 1)
  assert.equal(scenario.request.target, 'In Progress')
  assert.equal(scenario.steps.some(step => step.id === 'update' || step.id === 'history'), false)
  for (const step of scenario.steps) {
    assert.deepEqual(step.committed, { status: 'Assigned', version: 2, events: 2 })
    assert.equal(step.pending, null)
  }
  assert.equal(scenario.steps.at(-1)!.outcome, '409 · version_conflict')
})

test('a rejected event insert rolls back the pending update, leaving both stored values unchanged', () => {
  const scenario = getWriteScenario('event-failure')
  assert(scenario.steps.find(step => step.id === 'update')!.pending)
  const failure = scenario.steps.find(step => step.id === 'history')!
  assert.equal(failure.failed, true)
  assert.deepEqual(failure.pending, { status: 'Assigned', version: 2, events: 1 })
  for (const step of scenario.steps) {
    assert.deepEqual(step.committed, { status: 'Open', version: 1, events: 1 })
  }
  assert.equal(scenario.steps.at(-1)!.id, 'rollback')
  assert.equal(scenario.steps.at(-1)!.pending, null)
  assert.equal(scenario.steps.at(-1)!.outcome, 'Rolled back · no change saved')
})

test('switching scenarios starts from its own independent baseline', () => {
  const accepted = getWriteScenario('accepted')
  accepted.steps[0].committed.version = 99
  assert.equal(getWriteScenario('accepted').steps[0].committed.version, 1)
  assert.equal(getWriteScenario('stale').steps[0].committed.version, 2)
  assert.equal(getWriteScenario('event-failure').steps[0].committed.version, 1)
})
