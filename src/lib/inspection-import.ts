import { createDraft, makeBackup, parseBackup } from './inspection-core.mjs'

export type InspectionImportKey = 'clean' | 'conflict' | 'invalid' | 'full'
export type InspectionImportStage = 'file' | 'validate' | 'transaction' | 'write' | 'finish'
export type InspectionImportFrame = {
  id: string; stage: InspectionImportStage; title: string; detail: string;
  committed: string[]; pending: string[]; transaction: boolean;
  outcome: 'waiting' | 'committed' | 'aborted' | 'rejected'; error?: string;
}
export const inspectionImportOptions: { id: InspectionImportKey; label: string }[] = [
  { id: 'clean', label: 'Clean import' }, { id: 'conflict', label: 'Conflicting ID' },
  { id: 'invalid', label: 'Invalid backup' }, { id: 'full', label: 'Notebook full' },
]

// This builds inspectable snapshots of the source's transaction rules. It does
// not open IndexedDB: file validation alone runs the unmodified project core.
export function getInspectionImportScenario(key: InspectionImportKey) {
  const now = '2026-10-13T02:00:00.000Z'
  const base = key === 'full' ? Array.from({ length: 1000 }, (_, index) => `saved-${String(index + 1).padStart(3, '0')}`) : ['saved-001']
  const incoming = key === 'conflict' ? ['new-before', 'saved-001', 'new-after'] : key === 'full' || key === 'invalid' ? ['new-before'] : ['new-before', 'new-after']
  const envelope = makeBackup(incoming.map(id => createDraft(id, now)), now)
  const payload: unknown = key === 'invalid' ? { ...envelope, records: envelope.records.map(record => ({ ...record, condition: ['acceptable'] })) } : envelope
  const json = JSON.stringify(payload)
  const frames: InspectionImportFrame[] = []
  function frame(id: string, stage: InspectionImportStage, title: string, detail: string, pending: string[] = [], transaction = false, outcome: InspectionImportFrame['outcome'] = 'waiting', error?: string) {
    frames.push({ id, stage, title, detail, committed: [...base], pending: [...pending], transaction, outcome, ...(error ? { error } : {}) })
  }
  frame('file', 'file', 'A backup is selected', `${incoming.length} incoming ${incoming.length === 1 ? 'record' : 'records'} in a schema-version 1 envelope. The existing notebook is unchanged.`)
  let parsed
  try { parsed = parseBackup(json) } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid backup.'
    frame('invalid', 'validate', 'Rejected before storage', 'The condition is an array instead of a string. The real core parser rejects this payload before any transaction begins.', [], false, 'rejected', message)
    return { key, initialCount: base.length, incoming, frames, bytes: new TextEncoder().encode(json).length }
  }
  frame('validated', 'validate', 'Every record passes validation', 'The real parser checks the envelope, field types, timestamps and repeated IDs within the file. Existing notebook IDs are checked when storage adds run.')
  frame('transaction', 'transaction', 'One read/write transaction begins', `Capacity is checked inside the transaction: ${base.length} saved + ${parsed.length} incoming, with a limit of 1,000.` , [], true)
  if (base.length + parsed.length > 1000) {
    frame('capacity-abort', 'finish', 'Capacity exceeded · transaction aborted', 'No add request is issued. All 1,000 existing records remain unchanged.', [], false, 'aborted', 'This notebook supports at most 1000 records. Nothing was imported.')
    return { key, initialCount: base.length, incoming, frames, bytes: new TextEncoder().encode(json).length }
  }
  const pending: string[] = []
  for (const [index, record] of parsed.entries()) {
    if (base.includes(record.id)) {
      const error = `Record ${record.id} already exists. Nothing was imported.`
      frame('conflict', 'write', 'An add request hits an existing ID', 'The store uses add, never overwrite. The earlier new record is still pending; the duplicate fails and the transaction is aborted.', pending, true, 'waiting', error)
      frame('rollback', 'finish', 'All pending additions roll back', 'Neither new-before nor new-after is committed. Later aborted callbacks cannot replace the original duplicate-ID error.', [], false, 'aborted', error)
      return { key, initialCount: base.length, incoming, frames, bytes: new TextEncoder().encode(json).length }
    }
    pending.push(record.id)
    frame(index === 0 ? 'add-first' : 'add-second', 'write', `${record.id} is pending`, 'Add requests are queued in one transaction. This frame inspects their progress; no success is shown and no new record is durable yet.', pending, true)
  }
  frame('commit', 'finish', 'Transaction complete · all records committed', 'Only the completion event confirms success. Both new records become durable together; there is no partially imported notebook.', [], false, 'committed')
  frames.at(-1)!.committed.push(...pending)
  return { key, initialCount: base.length, incoming, frames, bytes: new TextEncoder().encode(json).length }
}
