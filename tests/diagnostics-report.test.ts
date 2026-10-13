import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readDiagnosticsReport } from '../src/lib/diagnostics-report.ts'

const recorded = () => JSON.parse(readFileSync(new URL('../public/evidence/normal-report.json', import.meta.url), 'utf8'))
const response = (value: unknown) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } })

test('the recorded report preserves normal, timeout and recovery evidence', async () => {
  const report = await readDiagnosticsReport(response(recorded()))
  assert.equal(report.cases.length, 11)
  assert.equal(report.cases.find(item => item.scenario === 'normal')?.attempts[0]?.request.operation, 'get_status')
  assert.equal(report.cases.find(item => item.scenario === 'timeout')?.attempt_count, 2)
  assert.equal(report.cases.find(item => item.scenario === 'recover_after_disconnect')?.diagnostic, 'ok')
  assert.equal(report.source_sha256, 'a34b291234de95852507ed51bb722699d5249e0585f49adedd0e2cb5533588ad')
})

test('HTTP failure and invalid JSON are rejected before reaching the viewer', async () => {
  await assert.rejects(readDiagnosticsReport(new Response('{}', { status: 503 })), /report/i)
  await assert.rejects(readDiagnosticsReport(new Response('not json')), /report/i)
})

const invalidReports: [string, (report: any) => unknown][] = [
  ['null document', () => null],
  ['missing cases', report => { delete report.cases; return report }],
  ['empty cases', report => { report.cases = []; return report }],
  ['missing source hash', report => { delete report.source_sha256; return report }],
  ['invalid source hash', report => { report.source_sha256 = 'partial'; return report }],
  ['invalid capture time', report => { report.started_at_utc = 'yesterday'; return report }],
  ['missing run identity', report => { report.run_id = ''; return report }],
  ['different evidence origin', report => { report.evidence_origin = 'physical-device'; return report }],
  ['unsupported schema', report => { report.schema_version = 2; return report }],
  ['duplicate scenarios', report => { report.cases[1].scenario = 'normal'; return report }],
  ['duplicate case identities', report => { report.cases[1].case_id = report.cases[0].case_id; return report }],
  ['missing expected diagnostic', report => { delete report.cases[0].expected; return report }],
  ['unknown outcome', report => { report.cases[0].outcome = 'maybe'; return report }],
  ['non-text outcome', report => { report.cases[0].outcome = ['pass']; return report }],
  ['negative duration', report => { report.cases[0].duration_ms = -1; return report }],
  ['missing attempts', report => { delete report.cases[0].attempts; return report }],
  ['incorrect attempt count', report => { report.cases[0].attempt_count = 99; return report }],
  ['duplicate attempt numbers', report => { report.cases[1].attempts[1].attempt = 1; return report }],
  ['missing attempt diagnostic', report => { delete report.cases[0].attempts[0].diagnostic; return report }],
  ['invalid attempt duration', report => { report.cases[0].attempts[0].duration_ms = null; return report }],
  ['non-object request', report => { report.cases[0].attempts[0].request = []; return report }],
  ['non-object response', report => { report.cases[0].attempts[0].response = 'wrong'; return report }],
  ['non-text message', report => { report.cases[0].attempts[0].message = {}; return report }],
]

for (const [name, mutate] of invalidReports) {
  test(`the viewer rejects ${name}`, async () => {
    await assert.rejects(readDiagnosticsReport(response(mutate(recorded()))), /report/i)
  })
}

test('absent responses and optional messages are valid for failed transport attempts', async () => {
  const input = recorded()
  delete input.cases[1].attempts[0].response
  input.cases[1].attempts[0].message = null
  const report = await readDiagnosticsReport(response(input))
  assert.equal(report.cases[1].attempts[0].response, undefined)
  assert.equal(report.cases[1].attempts[0].message, null)
})
