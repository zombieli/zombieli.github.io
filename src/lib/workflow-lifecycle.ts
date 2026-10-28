import contract from '../data/workflow-contract.json' with { type: 'json' }

export type LifecycleStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed'
export type LifecycleEvent = { from: LifecycleStatus | null; to: LifecycleStatus; note: string; version: number }
export type LifecycleState = {
  status: LifecycleStatus
  assignee: string | null
  resolution: string | null
  version: number
  history: LifecycleEvent[]
}
export type LifecycleFields = { assignee?: string; resolution?: string }
export type LifecycleResult =
  | { ok: true; state: LifecycleState }
  | { ok: false; code: 'invalid_transition' | 'assignee_required' | 'resolution_required'; message: string }

export const lifecycleStatuses = contract.statuses as LifecycleStatus[]
export const lifecycleTransitions = contract.transitions as Record<LifecycleStatus, LifecycleStatus[]>

export function createLifecycleExample(): LifecycleState {
  return { status: 'Open', assignee: null, resolution: null, version: 1, history: [{ from: null, to: 'Open', note: 'Created', version: 1 }] }
}

/** A small, in-memory explanation of the source contract, not a replacement API. */
export function applyLifecycleChange(state: LifecycleState, target: LifecycleStatus, fields: LifecycleFields = {}): LifecycleResult {
  if (!lifecycleTransitions[state.status].includes(target)) {
    return { ok: false, code: 'invalid_transition', message: state.status === 'Closed' ? 'Closed is terminal. Reset the example to explore another path.' : `${state.status} cannot move directly to ${target}. No record or history was changed.` }
  }
  const assignee = fields.assignee?.trim() || ''
  const resolution = fields.resolution?.trim() || ''
  if (target === 'Assigned' && (!assignee || assignee.length > 80)) {
    return { ok: false, code: 'assignee_required', message: 'Assignment needs a technician label of 1–80 characters. No change was saved.' }
  }
  if (target === 'Resolved' && (!resolution || resolution.length > 2000)) {
    return { ok: false, code: 'resolution_required', message: 'Resolution needs a treatment note of 1–2,000 characters. No change was saved.' }
  }
  const version = state.version + 1
  const note = target === 'Assigned' ? `Assigned to ${assignee}` : target === 'Resolved' ? resolution : target === 'Open' ? 'Reopened' : target
  return {
    ok: true,
    state: {
      status: target,
      assignee: target === 'Open' ? null : target === 'Assigned' ? assignee : state.assignee,
      resolution: target === 'Open' ? null : target === 'Resolved' ? resolution : state.resolution,
      version,
      history: [...state.history, { from: state.status, to: target, note, version }],
    },
  }
}
