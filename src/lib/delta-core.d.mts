/** Types for the unmodified Test Report Delta core. */
export type DeltaStatus = 'passed' | 'failed' | 'skipped'
export type DeltaCase = { suite: string; name: string; status: DeltaStatus; durationMs: number }
export type DeltaReport = { schemaVersion: number; label?: string; cases: DeltaCase[] }
export type DeltaPolicy = { allowRemoved: boolean; allowSkipped: boolean; slowdownRatio: number; slowdownMs: number }
export type DeltaRow = {
  suite: string; name: string; kind: 'unchanged' | 'added' | 'removed' | 'persistent-failure' | 'regression' | 'new-skipped' | 'recovery' | 'resumed';
  newSkipped: boolean; baseline: Pick<DeltaCase, 'status' | 'durationMs'> | null; candidate: Pick<DeltaCase, 'status' | 'durationMs'> | null;
  timing: 'unavailable' | 'stable' | 'slower' | 'faster'; deltaMs: number | null; ratio: number | null;
}
export type DeltaResult = {
  schemaVersion: number; baselineLabel: string; candidateLabel: string; verdict: 'fail' | 'incomplete' | 'pass'; reasons: string[]; policy: DeltaPolicy;
  counts: Record<'baseline' | 'candidate' | 'regressions' | 'persistentFailures' | 'recoveries' | 'resumed' | 'added' | 'removed' | 'newSkipped' | 'candidateFailures' | 'slower' | 'faster', number>;
  rows: DeltaRow[];
}
export const MAX_CASES: number
export const MAX_FILE_BYTES: number
export function validateReport(raw: unknown): DeltaReport
export function compareReports(baseline: unknown, candidate: unknown, options?: Partial<DeltaPolicy>): DeltaResult
export function formatHuman(result: DeltaResult): string
