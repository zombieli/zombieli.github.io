import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getInspectionImportScenario } from '../src/lib/inspection-import.ts'

test('a clean backup keeps additions pending until a single atomic commit', () => {
  const scenario = getInspectionImportScenario('clean')
  for (const frame of scenario.frames.slice(0, -1)) assert.deepEqual(frame.committed, ['saved-001'])
  assert.deepEqual(scenario.frames.find(frame => frame.id === 'add-second')!.pending, ['new-before', 'new-after'])
  const final = scenario.frames.at(-1)!
  assert.equal(final.outcome, 'committed')
  assert.deepEqual(final.committed, ['saved-001', 'new-before', 'new-after'])
  assert.deepEqual(final.pending, [])
})

test('an existing identity aborts all additions including the earlier queued record', () => {
  const scenario = getInspectionImportScenario('conflict')
  assert.deepEqual(scenario.incoming, ['new-before', 'saved-001', 'new-after'])
  assert.deepEqual(scenario.frames.find(frame => frame.id === 'add-first')!.pending, ['new-before'])
  assert.equal(scenario.frames.find(frame => frame.id === 'conflict')!.error, 'Record saved-001 already exists. Nothing was imported.')
  for (const frame of scenario.frames) assert.deepEqual(frame.committed, ['saved-001'])
  const final = scenario.frames.at(-1)!
  assert.equal(final.outcome, 'aborted')
  assert.deepEqual(final.pending, [])
  assert.equal(final.error, scenario.frames.find(frame => frame.id === 'conflict')!.error)
})

test('an invalid condition type is rejected by the real parser before any transaction', () => {
  const scenario = getInspectionImportScenario('invalid')
  assert.equal(scenario.frames.some(frame => frame.transaction), false)
  assert.equal(scenario.frames.at(-1)!.error, 'Unknown condition.')
  assert.equal(scenario.frames.at(-1)!.outcome, 'rejected')
  assert.deepEqual(scenario.frames.at(-1)!.committed, ['saved-001'])
})

test('capacity is checked inside the transaction and no add runs when full', () => {
  const scenario = getInspectionImportScenario('full')
  assert.equal(scenario.initialCount, 1000)
  assert.equal(scenario.incoming.length, 1)
  assert(scenario.frames.find(frame => frame.id === 'transaction')!.transaction)
  assert.equal(scenario.frames.some(frame => frame.id.startsWith('add-')), false)
  for (const frame of scenario.frames) assert.equal(frame.committed.length, 1000)
  assert.equal(scenario.frames.at(-1)!.outcome, 'aborted')
})

test('scenario resets create independent frame snapshots and preserve source records', () => {
  const scenario = getInspectionImportScenario('clean')
  scenario.frames[0].committed.push('accidental-change')
  scenario.frames.find(frame => frame.id === 'add-first')!.pending.push('accidental-change')
  assert.deepEqual(scenario.frames[1].committed, ['saved-001'])
  assert.deepEqual(getInspectionImportScenario('clean').frames[0].committed, ['saved-001'])
  assert.deepEqual(getInspectionImportScenario('conflict').frames[0].pending, [])
})
