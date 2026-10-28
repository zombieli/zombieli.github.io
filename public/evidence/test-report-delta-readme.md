# Test Report Delta

Compare two test runs with a dependency-free Node CLI and a browser review workspace. Both use the same comparison engine. The result makes candidate failures, missing baseline cases and newly skipped tests visible before a release.

## Run locally

Requires Node 24 or later. No package installation is needed.

```sh
node --test tests/*.test.mjs
node src/cli.mjs web/samples/baseline.json web/samples/candidate.json
node scripts/serve.mjs
```

Open `http://127.0.0.1:4176/` and choose **Load sample comparison**. The sample intentionally includes a regression, a persistent failure, a recovery, a removed test, a new skip, an added test and a slowdown. The sample CLI exits with code 1 as expected.

The complete browser application is in `web/`. Serve that directory at any URL, including `/demos/test-report-delta/`; its assets use relative paths. Reports are read in browser memory. They are not uploaded or persisted. Sample loading retrieves only the bundled JSON files.

## Report schema

```json
{
  "schemaVersion": 1,
  "label": "Main build 1842",
  "cases": [
    {
      "suite": "Authentication",
      "name": "Sign in with valid credentials",
      "status": "passed",
      "durationMs": 120
    }
  ]
}
```

- `schemaVersion` must be exactly `1`; `cases` must be an array.
- `label` is optional text, at most 200 characters.
- `suite` and `name` must be nonblank strings, each at most 1,000 characters. Identities are exact, case-sensitive pairs; whitespace is preserved. Repeated identities within one report are rejected.
- `status` is exactly `passed`, `failed` or `skipped`. Framework-specific statuses must be mapped by the report producer.
- `durationMs` must be a finite, nonnegative JSON number, including for skipped cases. Zero is valid.
- Maximum 50,000 cases and 5 MiB per input file. Unknown fields are ignored when normalising a report.

This is a normalised report format. A direct JUnit/XML, TAP or test-framework importer is not included. Write an adapter to this schema when integrating another runner.

## Comparison rules

| Baseline | Candidate | Classification |
| --- | --- | --- |
| passed or skipped | failed | Regression |
| failed | failed | Persistent failure |
| failed | passed | Recovery |
| skipped | passed | Resumed |
| passed or failed | skipped | Newly skipped |
| absent | any status | Added |
| any status | absent | Removed |
| passed | passed | Unchanged status; timings compared |
| skipped | skipped | Unchanged |

An added skipped case is classified **added** and also counted as **newly skipped**. An added failed case is counted as a candidate failure. Counters describe overlapping facets rather than partitions: do not sum them as a total case count.

The verdict is `fail` if any candidate case failed. Otherwise it is `incomplete` when a baseline case is missing, a case is newly skipped, or the candidate has no cases. Otherwise it is `pass`. Failures take precedence, while all coverage reasons remain in the artifact. An empty candidate stays incomplete even with coverage overrides. Baseline skips that remain skipped do not add a new coverage gap; the comparison does not certify the completeness of the baseline.

### Timing

Only a case passing in both runs has comparable timing. A slowdown warning requires **both** `candidate / baseline > 1.5` and `candidate - baseline > 100 ms` by default. Thresholds are strict: equality does not warn. This prevents small absolute timing noise from triggering a large relative warning. A speedup uses the same thresholds in the opposite direction.

For a zero baseline, a positive candidate warns only when the absolute delta exceeds the limit. Zero to zero is stable. The JSON `ratio` is `null` when division is undefined or not finite; `timing` and `deltaMs` still identify the outcome. Timing warnings are advisory and do not change the verdict.

## CLI

```sh
node src/cli.mjs BASELINE.json CANDIDATE.json --json
node src/cli.mjs BASELINE.json CANDIDATE.json --allow-removed --allow-skipped
node src/cli.mjs BASELINE.json CANDIDATE.json --slowdown-ratio 2 --slowdown-ms 250
node src/cli.mjs --help
```

Human-readable output is the default; `--json` writes a deterministic comparison artifact to stdout. Ordering depends on the suite/name strings rather than input order or locale. Output has no timestamp, so repeating the comparison with the same inputs and policy produces the same JSON. Coverage overrides are explicit and recorded in `policy`.

| Exit | Meaning |
| --- | --- |
| `0` | Accepted by the comparison policy, or help shown |
| `1` | Candidate failures or incomplete coverage |
| `2` | Invalid JSON, schema, file, options or thresholds |

Errors go to stderr and emit no success artifact. A timing ratio must be finite and greater than 1; an absolute limit must be finite and nonnegative.

### CI usage

Keep a trusted baseline artifact and produce a candidate in the normalised format. For GitHub Actions, this step retains the comparator's real exit code while collecting the JSON report:

```yaml
- name: Compare test reports
  shell: bash
  run: |
    set +e
    node src/cli.mjs baseline.json candidate.json --json > delta.json
    status=$?
    exit "$status"
```

Configure your CI platform to retain `delta.json` even when the comparison step fails. Only add `--allow-removed` or `--allow-skipped` for a deliberate coverage decision. Do not automatically replace the trusted baseline after a failed comparison. Test execution and baseline storage are the caller's responsibility.

## Browser verification

The browser runner requires an existing Playwright installation as a development-only check. It is not a runtime dependency. Start the local server, then run:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chrome node scripts/browser-check.mjs
```

In PowerShell, set those environment variables with `$env:PLAYWRIGHT_MODULE` and `$env:CHROMIUM_PATH` before the same `node` command. `BASE_URL` selects a deployed demo directory, and `EVIDENCE_DIR` selects the output directory. Defaults are the local server and `evidence/`.

The runner verifies eleven browser scenarios and saves full-page screenshots at 1440 and 390 pixels, plus a JSON record. Responsive overflow is checked at 360, 390, 768 and 1440 pixels. After a browser run, `node scripts/verify.mjs` reruns the native tests and produces `evidence/verification.json`, the exact native test output, and a sample comparison artifact.

See [architecture](docs/architecture.md), [development log](docs/development-log.md) and [recorded verification](evidence/verification.json). The examples are synthetic, and desktop Chromium checks do not establish native phone or production-cloud verification.
