export const MAX_CASES = 50000;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const key = c => JSON.stringify([c.suite, c.name]);
const order = (a,b) => a < b ? -1 : a > b ? 1 : 0;
const invalid = message => { throw new Error(`Invalid report: ${message}`); };

export function validateReport(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.schemaVersion !== 1) invalid('schemaVersion must be 1');
  if (!Array.isArray(raw.cases) || raw.cases.length > MAX_CASES) invalid(`cases must be an array of at most ${MAX_CASES} items`);
  if (raw.label !== undefined && (typeof raw.label !== 'string' || raw.label.length > 200)) invalid('label must be a string of at most 200 characters');
  const seen = new Set();
  const cases = raw.cases.map((c,i) => {
    if (!c || typeof c !== 'object') invalid(`case ${i + 1} must be an object`);
    for (const field of ['suite','name']) if (typeof c[field] !== 'string' || !c[field].trim() || c[field].length > 1000) invalid(`case ${i + 1} ${field} must be nonblank text of at most 1000 characters`);
    if (!['passed','failed','skipped'].includes(c.status)) invalid(`case ${i + 1} has an unsupported status`);
    if (typeof c.durationMs !== 'number' || !Number.isFinite(c.durationMs) || c.durationMs < 0) invalid(`case ${i + 1} durationMs must be finite and nonnegative`);
    const identity = key(c);
    if (seen.has(identity)) invalid(`duplicate suite/name identity at case ${i + 1}`);
    seen.add(identity);
    return { suite:c.suite, name:c.name, status:c.status, durationMs:c.durationMs };
  });
  cases.sort((a,b) => order(a.suite,b.suite) || order(a.name,b.name));
  return { schemaVersion:1, label:raw.label ?? '', cases };
}

export function compareReports(baselineInput, candidateInput, options = {}) {
  const baseline = validateReport(baselineInput), candidate = validateReport(candidateInput);
  const policy = { allowRemoved:false, allowSkipped:false, slowdownRatio:1.5, slowdownMs:100, ...options };
  if (typeof policy.allowRemoved !== 'boolean' || typeof policy.allowSkipped !== 'boolean' || !Number.isFinite(policy.slowdownRatio) || policy.slowdownRatio <= 1 || !Number.isFinite(policy.slowdownMs) || policy.slowdownMs < 0) throw new Error('Invalid policy: booleans required; slowdown ratio must exceed 1 and milliseconds must be nonnegative');
  const before = new Map(baseline.cases.map(c => [key(c),c]));
  const after = new Map(candidate.cases.map(c => [key(c),c]));
  const rows = [...new Set([...before.keys(),...after.keys()])].map(identity => {
    const b = before.get(identity), c = after.get(identity), reference = c ?? b;
    let kind = 'unchanged';
    if (!b) kind = 'added';
    else if (!c) kind = 'removed';
    else if (c.status === 'failed') kind = b.status === 'failed' ? 'persistent-failure' : 'regression';
    else if (c.status === 'skipped' && b.status !== 'skipped') kind = 'new-skipped';
    else if (c.status === 'passed' && b.status === 'failed') kind = 'recovery';
    else if (c.status === 'passed' && b.status === 'skipped') kind = 'resumed';
    const newSkipped = c?.status === 'skipped' && b?.status !== 'skipped';
    let timing = 'unavailable', deltaMs = null, ratio = null;
    if (b?.status === 'passed' && c?.status === 'passed') {
      deltaMs = c.durationMs - b.durationMs;
      const rawRatio = c.durationMs / b.durationMs;
      ratio = Number.isFinite(rawRatio) ? rawRatio : null;
      timing = 'stable';
      if (deltaMs > policy.slowdownMs && (b.durationMs === 0 || rawRatio > policy.slowdownRatio)) timing = 'slower';
      else if (-deltaMs > policy.slowdownMs && (c.durationMs === 0 || b.durationMs / c.durationMs > policy.slowdownRatio)) timing = 'faster';
    }
    return { suite:reference.suite, name:reference.name, kind, newSkipped, baseline:b ? {status:b.status,durationMs:b.durationMs} : null, candidate:c ? {status:c.status,durationMs:c.durationMs} : null, timing, deltaMs, ratio };
  }).sort((a,b) => order(a.suite,b.suite) || order(a.name,b.name));
  const count = kind => rows.filter(r => r.kind === kind).length;
  const counts = { baseline:baseline.cases.length, candidate:candidate.cases.length, regressions:count('regression'), persistentFailures:count('persistent-failure'), recoveries:count('recovery'), resumed:count('resumed'), added:count('added'), removed:count('removed'), newSkipped:rows.filter(r => r.newSkipped).length, candidateFailures:candidate.cases.filter(c => c.status === 'failed').length, slower:rows.filter(r => r.timing === 'slower').length, faster:rows.filter(r => r.timing === 'faster').length };
  const reasons = [];
  if (counts.candidateFailures) reasons.push(`${counts.candidateFailures} candidate test(s) failed`);
  if (!candidate.cases.length) reasons.push('Candidate report contains no test cases');
  if (counts.removed && !policy.allowRemoved) reasons.push(`${counts.removed} baseline test(s) removed`);
  if (counts.newSkipped && !policy.allowSkipped) reasons.push(`${counts.newSkipped} test(s) newly skipped`);
  const verdict = counts.candidateFailures ? 'fail' : reasons.length ? 'incomplete' : 'pass';
  return { schemaVersion:1, baselineLabel:baseline.label, candidateLabel:candidate.label, verdict, reasons, policy, counts, rows };
}

export function formatHuman(result) {
  const c = result.counts;
  const lines = [`TEST REPORT DELTA · ${result.verdict.toUpperCase()}`, `${c.baseline} baseline → ${c.candidate} candidate tests`, `${c.regressions} regressions · ${c.persistentFailures} persistent failures · ${c.recoveries} recoveries`, `${c.added} added · ${c.removed} removed · ${c.newSkipped} newly skipped`, `${c.slower} slower · ${c.faster} faster (timing warnings are advisory)`, `Policy: removed ${result.policy.allowRemoved ? 'permitted' : 'blocked'}, newly skipped ${result.policy.allowSkipped ? 'permitted' : 'blocked'}; ratio > ${result.policy.slowdownRatio} AND delta > ${result.policy.slowdownMs}ms`];
  for (const reason of result.reasons) lines.push(`Reason: ${reason}`);
  for (const r of result.rows) if (r.kind !== 'unchanged' || ['slower','faster'].includes(r.timing)) lines.push(`${r.kind} | ${JSON.stringify(r.suite)} / ${JSON.stringify(r.name)} | ${r.baseline?.status ?? 'absent'} → ${r.candidate?.status ?? 'absent'} | ${r.timing}${r.deltaMs === null ? '' : ` (${r.deltaMs > 0 ? '+' : ''}${r.deltaMs}ms)`}`);
  return lines.join('\n');
}
