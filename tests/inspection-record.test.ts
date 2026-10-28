import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { beginRecordWrite, completeRecordWrite, createRecordExample, editRecordExample, failRecordWrite, recordIsLocked, simulateOtherTab, type RecordExample } from '../src/lib/inspection-record.ts'

test('validation source matches the standalone notebook core after normalizing line endings', () => {
  // The archived demo uses CRLF; the copied source uses LF. Preserve a strict
  // source comparison apart from that platform-specific line ending difference.
  const source = readFileSync(new URL('../src/lib/inspection-core.mjs', import.meta.url), 'utf8')
  const demo = readFileSync(new URL('../public/demos/inspection-notebook/core.mjs', import.meta.url), 'utf8')
  assert.equal(source.replaceAll('\r\n', '\n'), demo.replaceAll('\r\n', '\n'))
})

function completeForm(state: RecordExample) {
  return editRecordExample(state, { assetId: 'TRN-101', condition: 'acceptable', checks: { isolation: true, housing: true, indicators: true } })
}

test('incomplete drafts may save, but incomplete submissions never start a write', () => {
  const state = createRecordExample()
  const rejected = beginRecordWrite(state, 'submit')
  assert.equal(rejected.pending, null)
  assert.equal(rejected.outcome, 'rejected')
  assert.match(rejected.message, /Select a fictional asset/)
  assert.deepEqual(rejected.stored, state.stored)
  const pending = beginRecordWrite(state, 'save')
  assert.equal(pending.pending?.candidate.status, 'draft')
  assert.equal(pending.pending?.candidate.updatedAt, '2026-10-13T02:00:00.001Z')
})

test('submission requires condition and every checklist item; notes are optional', () => {
  const asset = editRecordExample(createRecordExample(), { assetId: 'TRN-101' })
  assert.match(beginRecordWrite(asset, 'submit').message, /Select a condition/)
  const condition = editRecordExample(asset, { condition: 'acceptable' })
  assert.match(beginRecordWrite(condition, 'submit').message, /Complete every checklist item/)
  const complete = beginRecordWrite(completeForm(condition), 'submit')
  assert.equal(complete.pending?.candidate.status, 'submitted')
  assert.equal(complete.pending?.candidate.notes, '')
  assert.equal(complete.pending?.candidate.submittedAt, complete.pending?.candidate.updatedAt)
})

test('pending writes lock edits, keep a detached snapshot, and leave stored data untouched until completion', () => {
  const before = completeForm(createRecordExample())
  const pending = beginRecordWrite(before, 'save')
  assert.equal(recordIsLocked(pending), true)
  assert.deepEqual(pending.stored, before.stored)
  assert.deepEqual(editRecordExample(pending, { notes: 'lost typing' }), pending)
  assert.deepEqual(beginRecordWrite(pending, 'submit'), pending)
  before.form.checks.isolation = false
  assert.equal(pending.pending?.candidate.checks.isolation, true)
  const committed = completeRecordWrite(pending)
  assert.equal(committed.pending, null)
  assert.equal(committed.stored.assetId, 'TRN-101')
  assert.equal(committed.stored.status, 'draft')
  assert.equal(recordIsLocked(committed), false)
})

test('a failed write preserves the unsaved form and original record, then unlocks editing', () => {
  const edited = editRecordExample(createRecordExample(), { notes: 'Keep this unsaved note.' })
  const failed = failRecordWrite(beginRecordWrite(edited, 'save'))
  assert.equal(failed.pending, null)
  assert.deepEqual(failed.stored, edited.stored)
  assert.deepEqual(failed.form, edited.form)
  assert.equal(recordIsLocked(failed), false)
  assert.equal(failed.outcome, 'rejected')
})

test('completed submissions stay read-only and cannot be resubmitted', () => {
  const committed = completeRecordWrite(beginRecordWrite(completeForm(createRecordExample()), 'submit'))
  assert.equal(committed.stored.status, 'submitted')
  assert.equal(recordIsLocked(committed), true)
  assert.deepEqual(editRecordExample(committed, { notes: 'changed' }), committed)
  assert.deepEqual(beginRecordWrite(committed, 'save'), committed)
  assert.deepEqual(simulateOtherTab(committed), committed)
})

test('same-clock saves advance the edit timestamp every time', () => {
  const once = completeRecordWrite(beginRecordWrite(createRecordExample(), 'save'))
  const twice = completeRecordWrite(beginRecordWrite(once, 'save'))
  assert.equal(once.stored.updatedAt, '2026-10-13T02:00:00.001Z')
  assert.equal(twice.stored.updatedAt, '2026-10-13T02:00:00.002Z')
})

test('another tab advances storage, rejecting a stale save without overwriting either form or saved record', () => {
  const edited = editRecordExample(createRecordExample(), { notes: 'This tab has unsaved work.' })
  const changed = simulateOtherTab(edited)
  assert.equal(changed.stored.notes, 'Saved from another tab.')
  assert.equal(changed.form.notes, 'This tab has unsaved work.')
  const rejected = beginRecordWrite(changed, 'save')
  assert.equal(rejected.pending, null)
  assert.match(rejected.message, /changed in another tab/)
  assert.deepEqual(rejected.stored, changed.stored)
  assert.deepEqual(rejected.form, changed.form)
})
