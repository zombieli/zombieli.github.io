import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyLifecycleChange, createLifecycleExample, lifecycleStatuses, type LifecycleState } from '../src/lib/workflow-lifecycle.ts'

const contract = JSON.parse(readFileSync(new URL('../src/data/workflow-contract.json', import.meta.url), 'utf8'))

test('lifecycle explorer follows all 25 status pairs in the shared project contract', () => {
  assert.deepEqual(lifecycleStatuses, contract.statuses)
  for (const from of lifecycleStatuses) for (const target of lifecycleStatuses) {
    const state: LifecycleState = { ...createLifecycleExample(), status: from, assignee: 'Demo Alex', resolution: 'Earlier treatment' }
    const before = structuredClone(state)
    const result = applyLifecycleChange(state, target, { assignee: 'Demo Sam', resolution: 'Synthetic treatment' })
    if (contract.transitions[from].includes(target)) {
      assert.equal(result.ok, true, `${from} to ${target}`)
      if (result.ok) {
        assert.equal(result.state.status, target)
        assert.equal(result.state.version, before.version + 1)
        assert.equal(result.state.history.length, before.history.length + 1)
      }
    } else {
      assert.equal(result.ok, false, `${from} to ${target}`)
      if (!result.ok) assert.equal(result.code, 'invalid_transition')
    }
    assert.deepEqual(state, before, 'an explanation step must not mutate its input')
  }
})

test('required fields reject empty or overlong text without adding history', () => {
  const open = createLifecycleExample()
  for (const assignee of ['', '   ', 'a'.repeat(81)]) {
    assert.equal(applyLifecycleChange(open, 'Assigned', { assignee }).ok, false)
  }
  const working: LifecycleState = { ...open, status: 'In Progress', assignee: 'Demo Alex' }
  for (const resolution of ['', '\n ', 'a'.repeat(2001)]) {
    assert.equal(applyLifecycleChange(working, 'Resolved', { resolution }).ok, false)
  }
  assert.equal(open.history.length, 1)
  assert.equal(working.history.length, 1)
})

test('reopening clears current fields while preserving every earlier event', () => {
  let state = createLifecycleExample()
  for (const [target, fields] of [
    ['Assigned', { assignee: '  Demo Alex  ' }],
    ['In Progress', {}],
    ['Resolved', { resolution: '  Synthetic treatment note  ' }],
  ] as const) {
    const result = applyLifecycleChange(state, target, fields)
    assert.equal(result.ok, true)
    if (result.ok) state = result.state
  }
  assert.equal(state.assignee, 'Demo Alex')
  assert.equal(state.resolution, 'Synthetic treatment note')
  const earlier = structuredClone(state.history)
  const reopened = applyLifecycleChange(state, 'Open')
  assert.equal(reopened.ok, true)
  if (!reopened.ok) return
  assert.equal(reopened.state.assignee, null)
  assert.equal(reopened.state.resolution, null)
  assert.deepEqual(reopened.state.history.slice(0, -1), earlier)
  assert.equal(reopened.state.history.at(-1)?.note, 'Reopened')
  assert.equal(reopened.state.version, 5)
})

test('closed is terminal and reset creates an independent initial example', () => {
  const closed: LifecycleState = { ...createLifecycleExample(), status: 'Closed' }
  assert.equal(applyLifecycleChange(closed, 'Open').ok, false)
  const first = createLifecycleExample()
  first.history[0].note = 'Changed by caller'
  assert.equal(createLifecycleExample().history[0].note, 'Created')
})
