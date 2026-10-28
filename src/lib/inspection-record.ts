import { createDraft, submitRecord, updateDraft, validateRecord, type InspectionPatch, type InspectionRecord } from './inspection-core.mjs'

type RecordForm = Pick<InspectionRecord, 'assetId' | 'condition' | 'checks' | 'notes'>
export type RecordWriteIntent = 'save' | 'submit'
export type RecordExample = {
  stored: InspectionRecord
  base: InspectionRecord
  form: RecordForm
  pending: { candidate: InspectionRecord; intent: RecordWriteIntent } | null
  outcome: 'ready' | 'pending' | 'saved' | 'rejected' | 'stale'
  message: string
}
const CLOCK = '2026-10-13T02:00:00.000Z'
const formOf = (record: RecordForm): RecordForm => ({ assetId: record.assetId, condition: record.condition, checks: { ...record.checks }, notes: record.notes })

export function createRecordExample(): RecordExample {
  const stored = createDraft('example-draft', CLOCK)
  return { stored, base: validateRecord(stored), form: formOf(stored), pending: null, outcome: 'ready', message: 'An empty draft is already saved in this example. Typing changes the editor only.' }
}
export function recordIsLocked(state: RecordExample) { return state.pending !== null || state.base.status === 'submitted' }
export function editRecordExample(state: RecordExample, patch: InspectionPatch): RecordExample {
  if (recordIsLocked(state)) return state
  return { ...state, form: formOf({ ...state.form, ...patch }) }
}

/** In-memory explanation of the checks in storage.mjs; no IndexedDB access. */
export function beginRecordWrite(state: RecordExample, intent: RecordWriteIntent): RecordExample {
  if (recordIsLocked(state)) return state
  try {
    let candidate = updateDraft(state.base, state.form, CLOCK)
    if (intent === 'submit') candidate = submitRecord(candidate, CLOCK)
    if (state.stored.status !== 'draft') throw new Error('Submitted records are read-only.')
    if (state.stored.updatedAt !== state.base.updatedAt) throw new Error('This draft changed in another tab. Reload before editing.')
    if (state.stored.createdAt !== candidate.createdAt || candidate.updatedAt < state.stored.updatedAt) throw new Error('Invalid record timestamp. Reload before editing.')
    return { ...state, form: formOf(state.form), pending: { candidate, intent }, outcome: 'pending', message: 'Write pending. The editor and Close are locked; the saved record has not changed. Choose an outcome below.' }
  } catch (error) {
    return { ...state, pending: null, outcome: 'rejected', message: error instanceof Error ? error.message : 'The write was rejected.' }
  }
}
export function completeRecordWrite(state: RecordExample): RecordExample {
  if (!state.pending) return state
  const stored = validateRecord(state.pending.candidate)
  return { stored, base: validateRecord(stored), form: formOf(stored), pending: null, outcome: 'saved', message: stored.status === 'submitted' ? 'Transaction completed. The submitted record is saved and read-only.' : 'Transaction completed. The draft is saved; editing is available again.' }
}
export function failRecordWrite(state: RecordExample): RecordExample {
  if (!state.pending) return state
  return { ...state, pending: null, outcome: 'rejected', message: 'Storage transaction failed. The saved record is unchanged; your unsaved input stays in the editor.' }
}
export function simulateOtherTab(state: RecordExample): RecordExample {
  if (recordIsLocked(state)) return state
  return { ...state, stored: updateDraft(state.stored, { notes: 'Saved from another tab.' }, CLOCK), outcome: 'stale', message: 'Another tab saved a newer draft in this example. Try Save draft: this editor still has the older timestamp.' }
}
