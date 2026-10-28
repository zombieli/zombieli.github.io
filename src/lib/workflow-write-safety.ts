// A presentation model of backend/app.py and its SQLite rollback/version tests.
// These synthetic snapshots explain the boundaries; they never call the API.
export type WriteScenarioId = 'accepted' | 'stale' | 'event-failure'
export type WriteSnapshot = { status: string; version: number; events: number }
export type WriteStep = {
  id: string
  label: string
  value: string
  detail: string
  committed: WriteSnapshot
  pending: WriteSnapshot | null
  outcome: string
  failed?: boolean
}
export type WriteScenario = {
  id: WriteScenarioId
  label: string
  explanation: string
  request: { expectedVersion: number; target: string; assignee: string | null }
  steps: WriteStep[]
}

export const writeScenarioOptions: { id: WriteScenarioId; label: string }[] = [
  { id: 'accepted', label: 'Accepted write' },
  { id: 'stale', label: 'Stale version' },
  { id: 'event-failure', label: 'Event insert failure' },
]

export function getWriteScenario(id: WriteScenarioId): WriteScenario {
  const baseline: WriteSnapshot = id === 'stale'
    ? { status: 'Assigned', version: 2, events: 2 }
    : { status: 'Open', version: 1, events: 1 }
  const updated: WriteSnapshot = { status: 'Assigned', version: 2, events: 1 }
  const complete: WriteSnapshot = { status: 'Assigned', version: 2, events: 2 }
  const step = (id: string, label: string, value: string, detail: string,
    pending: WriteSnapshot | null = null, outcome = 'Not committed', failed = false,
    committed = baseline): WriteStep => ({
      id, label, value, detail, pending: pending ? { ...pending } : null,
      committed: { ...committed }, outcome, failed,
    })

  const request = { expectedVersion: 1, target: id === 'stale' ? 'In Progress' : 'Assigned', assignee: id === 'stale' ? null : 'Alex' }
  const steps: WriteStep[] = [step('request', 'Request', `v1 → ${request.target}`,
    id === 'stale'
      ? 'This request still carries expected_version 1. Another accepted change has already assigned the order and committed version 2.'
      : 'A synthetic request asks to assign the Open order to Alex, carrying the version last read: expected_version 1.')]

  if (id === 'stale') {
    steps.push(
      step('check', 'Lock + check', 'v1 ≠ v2', 'BEGIN IMMEDIATE starts the write transaction. The API reads the current order and compares versions before attempting any status change.', null, 'Version mismatch', true),
      step('reject', 'Reject', '409 conflict', 'The API returns version_conflict. It does not update the order or add an event. Reload the record before deciding what to change next.', null, '409 · version_conflict', true),
    )
    return { id, label: 'Stale version', explanation: 'A newer version is already saved. An old request must not overwrite it.', request, steps }
  }

  steps.push(
    step('check', 'Lock + check', 'v1 = v1', 'BEGIN IMMEDIATE starts the transaction. The saved version matches; Open → Assigned is allowed and Alex supplies the required technician label.'),
    step('update', 'Update order', 'Assigned · v2', 'The UPDATE stages Assigned and version 2 inside the transaction. Other readers still see the last committed record; the change is not saved yet.', updated),
  )

  if (id === 'event-failure') {
    steps.push(
      step('history', 'Insert event', 'Insert rejected', 'The source test injects a SQLite trigger that rejects the history INSERT. The updated row is still pending, and no new event has been written.', updated, 'Event insert failed', true),
      step('rollback', 'Roll back', 'Both unchanged', 'The exception rolls back the transaction, discarding the pending row update. The stored order remains Open at version 1, with its original single event.', null, 'Rolled back · no change saved', true),
    )
    return { id, label: 'Event insert failure', explanation: 'The history insert fails after the row update. The transaction discards the pending change.', request, steps }
  }

  steps.push(
    step('history', 'Insert event', 'Event · v2', 'The history INSERT stages an Assigned event with the same version 2. Both writes are now pending within the same transaction.', complete),
    step('commit', 'Commit', 'Both saved', 'Leaving the transaction successfully commits the order and its history together. Readers can now see Assigned at version 2 and two events.', null, 'Committed · record + history', false, complete),
  )
  return { id, label: 'Accepted write', explanation: 'The order change and its matching history event become visible together.', request, steps }
}
