export type DiagnosticAttempt = {
  attempt: number
  diagnostic: string
  duration_ms: number
  request: Record<string, unknown>
  response?: Record<string, unknown> | null
  message?: string | null
}

export type DiagnosticCase = {
  case_id: string
  scenario: string
  expected: string
  diagnostic: string
  outcome: 'pass' | 'fail'
  attempt_count: number
  duration_ms: number
  attempts: DiagnosticAttempt[]
}

export type DiagnosticReport = {
  schema_version: 1
  run_id: string
  source_sha256: string
  started_at_utc: string
  evidence_origin: 'simulator'
  cases: DiagnosticCase[]
}

export async function readDiagnosticsReport(response: Response): Promise<DiagnosticReport> {
  if (!response.ok) throw new Error(`Report unavailable (${response.status})`)
  let value: unknown
  try {
    value = await response.json()
  } catch {
    throw new Error('Report contains invalid JSON')
  }
  const invalid = () => { throw new Error('Report does not match the recorded evidence format') }
  const record = (item: unknown): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)
  const text = (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0
  const duration = (item: unknown) => typeof item === 'number' && Number.isFinite(item) && item >= 0

  if (!record(value)) return invalid()
  if (value.schema_version !== 1 || !text(value.run_id) || value.evidence_origin !== 'simulator') return invalid()
  if (typeof value.source_sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(value.source_sha256)) return invalid()
  if (typeof value.started_at_utc !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value.started_at_utc) || Number.isNaN(Date.parse(value.started_at_utc))) return invalid()
  if (!Array.isArray(value.cases) || value.cases.length === 0) return invalid()

  const caseIds = new Set<string>()
  const scenarios = new Set<string>()
  for (const item of value.cases) {
    if (!record(item) || !text(item.case_id) || !text(item.scenario) || !text(item.expected) || !text(item.diagnostic)) return invalid()
    if (caseIds.has(item.case_id) || scenarios.has(item.scenario)) return invalid()
    caseIds.add(item.case_id)
    scenarios.add(item.scenario)
    if ((item.outcome !== 'pass' && item.outcome !== 'fail') || !duration(item.duration_ms)) return invalid()
    if (!Array.isArray(item.attempts) || item.attempts.length === 0 || item.attempt_count !== item.attempts.length) return invalid()
    for (const [index, attempt] of item.attempts.entries()) {
      if (!record(attempt) || attempt.attempt !== index + 1 || !text(attempt.diagnostic) || !duration(attempt.duration_ms) || !record(attempt.request)) return invalid()
      if (attempt.response != null && !record(attempt.response)) return invalid()
      if (attempt.message != null && typeof attempt.message !== 'string') return invalid()
    }
  }
  return value as DiagnosticReport
}
