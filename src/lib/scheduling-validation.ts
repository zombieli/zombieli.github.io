// Presentation port of scheduler.py's independent feasibility checks.
// It validates candidate timelines; it does not choose jobs or run a policy.
export type ValidationJob = { id: string; release: number; duration: number }
export type ValidationSlot = { job_id: string; start: number; end: number }
type JobInput = { id: unknown; release: unknown; duration: unknown }
type SlotInput = { job_id?: unknown; start?: unknown; end?: unknown }
export type ScheduleViolation = 'unknown_job' | 'duplicate_job' | 'missing_jobs' | 'invalid_time' | 'before_release' | 'wrong_duration' | 'overlap_or_missing_gap'
export type ValidationCaseId = 'valid' | 'gap' | 'release' | 'duplicate'

function validateJobs(jobs: readonly JobInput[], gap: number): asserts jobs is readonly ValidationJob[] {
  if (!Number.isInteger(gap) || gap < 0) throw new Error('Gap must be a non-negative integer')
  const ids = new Set<string>()
  for (const job of jobs) {
    if (typeof job.id !== 'string' || !job.id.trim() || ids.has(job.id)) throw new Error('Job IDs must be nonempty and unique')
    if (typeof job.release !== 'number' || !Number.isInteger(job.release) || job.release < 0 || typeof job.duration !== 'number' || !Number.isInteger(job.duration) || job.duration <= 0) throw new Error('Release and duration must be valid integer minutes')
    ids.add(job.id)
  }
}

export function checkSchedule(jobs: readonly JobInput[], slots: readonly SlotInput[], gap = 2): ScheduleViolation[] {
  validateJobs(jobs, gap)
  const lookup = new Map(jobs.map(job => [job.id, job]))
  const seen = new Set<string>()
  const problems: ScheduleViolation[] = []
  let previousEnd: number | undefined
  for (const slot of slots) {
    const job = typeof slot.job_id === 'string' ? lookup.get(slot.job_id) : undefined
    if (!job) { problems.push('unknown_job'); continue }
    if (seen.has(job.id)) problems.push('duplicate_job')
    seen.add(job.id)
    if (typeof slot.start !== 'number' || typeof slot.end !== 'number' || !Number.isInteger(slot.start) || !Number.isInteger(slot.end)) { problems.push('invalid_time'); continue }
    if (slot.start < job.release) problems.push('before_release')
    if (slot.end - slot.start !== job.duration) problems.push('wrong_duration')
    if (previousEnd !== undefined && slot.start < previousEnd + gap) problems.push('overlap_or_missing_gap')
    previousEnd = slot.end
  }
  if (seen.size !== lookup.size) problems.push('missing_jobs')
  return problems
}

export function calculateValidatedMetrics(jobs: readonly JobInput[], slots: readonly SlotInput[], gap = 2) {
  const errors = checkSchedule(jobs, slots, gap)
  if (errors.length) throw new Error(`Infeasible schedule: ${errors.join(', ')}`)
  const release = new Map((jobs as readonly ValidationJob[]).map(job => [job.id, job.release]))
  const validSlots = slots as readonly ValidationSlot[]
  const waits = validSlots.map(slot => slot.start - release.get(slot.job_id)!)
  return {
    mean_wait_min: waits.length ? waits.reduce((sum, wait) => sum + wait, 0) / waits.length : 0,
    max_wait_min: waits.length ? Math.max(...waits) : 0,
    finish_min: validSlots.length ? validSlots[validSlots.length - 1].end : 0,
    constraint_violations: 0,
  }
}

export const validationCases: { id: ValidationCaseId; label: string }[] = [
  { id: 'valid', label: 'Valid schedule' }, { id: 'gap', label: 'Missing changeover' },
  { id: 'release', label: 'Before release' }, { id: 'duplicate', label: 'Duplicate job' },
]

export function getValidationCase(id: ValidationCaseId) {
  const jobs: ValidationJob[] = [{ id: 'a', release: 0, duration: 4 }, { id: 'b', release: 0, duration: 2 }]
  const slots: ValidationSlot[] = [{ job_id: 'a', start: 0, end: 4 }, { job_id: 'b', start: 6, end: 8 }]
  let changedIndex = -1
  let explanation = 'Both jobs appear once, start after release and leave the required two-minute changeover.'
  if (id === 'gap') {
    slots[1] = { job_id: 'b', start: 5, end: 7 }; changedIndex = 1
    explanation = 'Job b starts at minute 5. Job a ends at 4, leaving only one minute for a two-minute changeover.'
  } else if (id === 'release') {
    slots[0] = { job_id: 'a', start: -1, end: 3 }; changedIndex = 0
    explanation = 'Job a starts at minute −1, before its release at 0. Its four-minute duration is still correct.'
  } else if (id === 'duplicate') {
    slots[1] = { job_id: 'a', start: 6, end: 10 }; changedIndex = 1
    explanation = 'The second slot repeats job a. Job b is missing, even though both slots have valid times and spacing.'
  }
  return { id, jobs, slots, changedIndex, explanation }
}

export const validationChecks: { id: string; label: string; detail: string; codes: ScheduleViolation[] }[] = [
  { id: 'coverage', label: 'Coverage', detail: 'Every input job must appear exactly once. Reject unknown, repeated or missing jobs.', codes: ['unknown_job', 'duplicate_job', 'missing_jobs'] },
  { id: 'release', label: 'Release + time', detail: 'Start and end must be integer minutes. A job cannot start before its release.', codes: ['invalid_time', 'before_release'] },
  { id: 'duration', label: 'Duration', detail: 'End minus start must equal the job’s required processing duration.', codes: ['wrong_duration'] },
  { id: 'gap', label: 'Changeover', detail: 'Each next start must be at least two minutes after the previous end, in the supplied slot order.', codes: ['overlap_or_missing_gap'] },
  { id: 'metrics', label: 'Metrics gate', detail: 'Calculate waiting metrics only when the complete independent validation reports no violations.', codes: [] },
]

export const violationDescriptions: Record<ScheduleViolation, string> = {
  unknown_job: 'A slot names a job that is not in the input.',
  duplicate_job: 'Job a appears more than once.',
  missing_jobs: 'At least one input job is missing from the schedule.',
  invalid_time: 'A start or end is not an integer minute.',
  before_release: 'Job a starts before its release at minute 0.',
  wrong_duration: 'A slot does not run for its required duration.',
  overlap_or_missing_gap: 'Only one minute separates a and b; two minutes are required.',
}
