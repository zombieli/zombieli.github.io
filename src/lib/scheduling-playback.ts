import saved from '../data/scheduling-playback.json' with { type: 'json' }

export type SchedulingPolicy = 'fcfs' | 'spt'
export type RecordedJob = { id: string; release: number; duration: number }
export type RecordedSlot = { job_id: string; start: number; end: number }
export type RecordedSchedule = { slots: RecordedSlot[]; metrics: { mean_wait_min: number; max_wait_min: number; finish_min: number } }
export type RecordedScenario = { name: string; jobs: RecordedJob[]; policies: Record<SchedulingPolicy, RecordedSchedule> }
export const recordedPlayback = saved

/** Explain a saved dispatch; this does not generate or modify a schedule. */
export function getDispatchContext(scenario: RecordedScenario, policy: SchedulingPolicy, index: number) {
  const slots = scenario.policies[policy].slots
  if (!Number.isInteger(index) || index < 0 || index >= slots.length) throw new RangeError('Unknown recorded dispatch')
  const slot = slots[index]
  const job = scenario.jobs.find(item => item.id === slot.job_id)!
  const completed = new Set(slots.slice(0, index).map(item => item.job_id))
  const pending = scenario.jobs.filter(item => !completed.has(item.id))
  const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
  const ready = pending.filter(item => item.release <= slot.start).sort((a, b) =>
    (policy === 'spt' ? a.duration - b.duration : 0) || a.release - b.release || compareId(a.id, b.id))
  const future = pending.filter(item => item.release > slot.start)
  const availableAt = index === 0 ? 0 : slots[index - 1].end + recordedPlayback.gap_minutes
  return { slot, job, ready, future, wait: slot.start - job.release, availableAt, idleMinutes: slot.start - availableAt }
}
