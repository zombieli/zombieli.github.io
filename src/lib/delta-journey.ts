import { compareReports, validateReport, type DeltaReport, type DeltaResult } from './delta-core.mjs'
export type PolicyScenario = 'sample' | 'coverage' | 'added-failure' | 'empty' | 'timing'
export function policyScenario(name: PolicyScenario, baseline: unknown, candidate: unknown, before = 100, after = 450) {
  const report = (label: string, cases: DeltaReport['cases']): DeltaReport => ({ schemaVersion: 1, label, cases })
  const item = (name: string, status: 'passed' | 'failed' | 'skipped', durationMs = 100) => ({ suite: 'Illustrative checks', name, status, durationMs })
  if (name === 'sample') return { baseline: validateReport(baseline), candidate: validateReport(candidate) }
  if (name === 'timing') return { baseline: report('Timing baseline', [item('Render view', 'passed', before)]), candidate: report('Timing candidate', [item('Render view', 'passed', after)]) }
  const base = report('Example baseline', [item('Keep', 'passed'), item('Remove', 'passed'), item('Skip', 'passed')])
  if (name === 'coverage') return { baseline: base, candidate: report('Example candidate', [item('Keep', 'passed'), item('Skip', 'skipped', 0)]) }
  if (name === 'empty') return { baseline: base, candidate: report('Empty candidate', []) }
  return { baseline: report('Example baseline', [item('Keep', 'passed')]), candidate: report('Example candidate', [item('Keep', 'passed'), item('Added failure', 'failed')]) }
}

export type ReadSlot = 'baseline' | 'candidate'
export type ReadState = {
  reports: Record<ReadSlot, DeltaReport | null>; tokens: Record<ReadSlot, number>;
  loading: Record<ReadSlot, boolean>; errors: Record<ReadSlot, string>; result: DeltaResult | null;
}
export function createReadState(baseline?: unknown, candidate?: unknown): ReadState {
  const reports = { baseline: baseline ? validateReport(baseline) : null, candidate: candidate ? validateReport(candidate) : null }
  return { reports, tokens: { baseline: 0, candidate: 0 }, loading: { baseline: false, candidate: false }, errors: { baseline: '', candidate: '' }, result: reports.baseline && reports.candidate ? compareReports(reports.baseline, reports.candidate) : null }
}
/** Deterministic model of the real browser's per-input generation guards. No file or network I/O. */
export function beginRead(state: ReadState, slot: ReadSlot): ReadState {
  return { ...state, reports: { ...state.reports, [slot]: null }, tokens: { ...state.tokens, [slot]: state.tokens[slot] + 1 }, loading: { ...state.loading, [slot]: true }, errors: { ...state.errors, [slot]: '' }, result: null }
}
export function settleRead(state: ReadState, slot: ReadSlot, token: number, json: string): ReadState {
  if (token !== state.tokens[slot]) return state
  let report: DeltaReport | null = null, error = ''
  try {
    let raw: unknown
    try { raw = JSON.parse(json) } catch { throw new Error('Malformed JSON.') }
    report = validateReport(raw)
  } catch (reason) { error = reason instanceof Error ? reason.message : 'Invalid report.' }
  const reports = { ...state.reports, [slot]: report }
  return { ...state, reports, loading: { ...state.loading, [slot]: false }, errors: { ...state.errors, [slot]: error }, result: reports.baseline && reports.candidate ? compareReports(reports.baseline, reports.candidate) : null }
}
export type RaceScenario = 'stale' | 'independent'
export function raceFrames(kind: RaceScenario) {
  const report = (label: string) => ({ schemaVersion: 1, label, cases: [{ suite: 'Example', name: 'Keep', status: 'passed', durationMs: 100 }] })
  let state = kind === 'stale' ? createReadState(report('Accepted baseline'), report('Accepted candidate')) : createReadState()
  const frames: { title: string; detail: string; lane: ReadSlot | 'result'; ignored: boolean; state: ReadState }[] = []
  const capture = (title: string, detail: string, lane: ReadSlot | 'result', ignored = false) => frames.push({ title, detail, lane, ignored, state })
  if (kind === 'stale') {
    capture('An accepted comparison is visible', 'Two valid illustrative reports satisfy the policy. A downloadable comparison exists.', 'result')
    state = beginRead(state, 'candidate')
    capture('Candidate read A begins · token 1', 'The candidate and the old result clear immediately. There is no accepted verdict while the replacement is pending.', 'candidate')
    state = beginRead(state, 'candidate')
    capture('A newer candidate B begins · token 2', 'Another selection advances this slot’s token. Read A still carries token 1.', 'candidate')
    state = settleRead(state, 'candidate', 2, '{ malformed')
    capture('Candidate B is rejected', 'The current file is malformed. Keep the candidate empty, show its error and leave the download unavailable.', 'candidate')
    state = settleRead(state, 'candidate', 1, JSON.stringify(report('Older candidate A')))
    capture('Older read A finishes · ignored', 'Its token 1 does not match current token 2. Neither its valid report nor an obsolete error may replace the latest state.', 'candidate', true)
  } else {
    capture('Start with no comparison', 'The example will load sample reports in both slots, then replace only the candidate.', 'result')
    state = beginRead(beginRead(state, 'baseline'), 'candidate')
    capture('Both sample reads begin · token 1 each', 'Each report has a separate token. The two slots are loading independently.', 'result')
    state = beginRead(state, 'candidate')
    capture('Replace just the candidate · token 2', 'Only the candidate token advances. The baseline still owns token 1.', 'candidate')
    state = settleRead(state, 'candidate', 2, JSON.stringify(report('New candidate')))
    capture('New candidate finishes first', 'One valid report is ready. Wait for the untouched baseline before comparing.', 'candidate')
    state = settleRead(state, 'baseline', 1, JSON.stringify(report('Sample baseline')))
    capture('The untouched baseline finishes', 'Baseline token 1 is still current. It may settle and compare with the new candidate; it must not stay stuck loading.', 'baseline')
    state = settleRead(state, 'candidate', 1, JSON.stringify(report('Older sample candidate')))
    capture('Older sample candidate finishes · ignored', 'Candidate token 1 is obsolete. Preserve the completed baseline and the user’s newer candidate.', 'candidate', true)
  }
  return frames
}
