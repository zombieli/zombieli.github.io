# Architecture

## Shared domain boundary

`web/core.mjs` is a pure module imported by `web/app.mjs`, `src/cli.mjs` and the native tests. It has no DOM, file-system, network, clock or process dependency. `validateReport` copies and normalises a report. `compareReports` validates both inputs, matches exact suite/name identities and returns a complete comparison artifact. `formatHuman` renders the same artifact for terminal review.

An identity is encoded as the JSON array `[suite, name]`. This avoids ambiguous concatenation where a colon or other separator appears in a suite or name. Cases sort by deterministic JavaScript string comparison. Matching uses maps, so comparisons avoid searching every candidate against every baseline.

`compareReports` exposes `schemaVersion`, report labels, `verdict`, `reasons`, `policy`, `counts` and `rows`. Every row has the suite/name identity, primary `kind`, `newSkipped` flag, optional baseline and candidate status/timing, and the derived `timing`, `deltaMs` and `ratio`. Missing cases have a `null` side. A ratio that is not finite is represented as `null`, never Infinity or an invalid JSON number.

## Policy and review decisions

All failed candidate cases block acceptance, including newly added failures. A recovered baseline failure no longer blocks the candidate. Missing baseline coverage and new skips are incomplete by default. `allowRemoved` and `allowSkipped` must be explicit booleans and only permit their corresponding coverage condition. No option permits an empty candidate or a failed candidate.

Timing warnings are a separate concern. A test must pass in both reports to be eligible. Both relative and absolute strict limits must be crossed, reducing warnings caused by low baseline duration or measurement noise. A zero baseline is handled without relying on a finite ratio. Timing warnings remain advisory because single-run measurements lack distribution and environment context.

## CLI boundary

`src/cli.mjs` owns command-line parsing, file reading, JSON parsing, stdout/stderr and process exit status. It reads two reports and delegates all domain decisions to the pure module. Input errors never emit a partial comparison. Exit 1 deliberately covers both failed and incomplete comparisons, so a pipeline cannot accidentally accept lost coverage.

The CLI bounds accepted file size and the core bounds case counts and text lengths. These are local tool safeguards rather than a claim of hostile-environment isolation. JSON adapters for existing test runners are outside this version's scope.

## Browser state

`web/app.mjs` holds the two validated reports, current comparison, filter, per-input read generation tokens and per-input error messages. Selecting a replacement immediately invalidates that report and clears the verdict, cases and download action. The previous accepted result cannot remain visible while a replacement is being read.

Each asynchronous file read captures its slot's generation token. A later selection advances that token. The earlier read cannot commit its result or error when the token no longer matches. Sample loading captures a token for each report and settles each report independently. If a user replaces the candidate while sample loading is pending, the sample baseline can still settle while the superseded sample candidate is ignored. Success and error handling use the same per-report guard, so an untouched report cannot remain stranded in a loading state. Invalid policy input clears the comparison until it is repaired.

The failure summary card uses the total candidate failure count. This includes regressions, persistent failures and newly added failures, matching the verdict and the failure filter.

Case labels, suite labels, report labels, error messages and reasons are inserted through `textContent` into created DOM nodes. No imported report string is used as HTML. Filters and search operate on the current comparison only. Downloads create a JSON Blob from the complete comparison rather than the filtered subset.

## Hosting and verification

`web/` is the complete browser distribution: HTML, styles, modules and two sample JSON files. Every asset path is relative. There are no runtime packages, external fonts, analytics or backend requests. `scripts/serve.mjs` is a development server, not a production server.

Native tests cover validation, all status transitions, coverage overrides, deterministic ordering, timing boundaries and real CLI process exits. The development-only browser runner verifies interaction, safety and state replacement in Chromium. It accepts environment configuration so the same checks can run against local, staged or published demo directories. Evidence is saved separately from the comparison's deterministic output.
