# Diagnostics build journey implementation plan

**Goal:** Implement the user-approved six-stage development story and two recorded-evidence interactions, preserving the portfolio's appearance, then provide a local preview.

**Architecture:** Keep Vue, Vite and the existing diagnostics route. The case owns the normal report; two focused components explain retry policy and expected outcomes. The latter loads the independently recorded failure report. All stages remain readable and directly linkable.

**Spec:** The approved conversation proposal: scope → protocol → architecture → fault handling → verification → evidence and delivery. Preserve English copy, blue/white styling, existing downloads and the eleven-scenario viewer. No new runtime dependencies or publication.

## Tasks

- [x] Add browser acceptance checks, observe their failure against the existing site.
- [x] Reorganise DiagnosticsCase.vue into six stages with a desktop stage rail and mobile wrapping navigation. Keep #problem, #design, #demo, #results and #reproduce anchors.
- [x] Add DiagnosticsRetry.vue and DiagnosticsExpectation.vue, consuming `{ report, loading, error }` and emitting `retry` for the normal report. Keep report-driven attempts and outcomes, keyboard controls, loading/error recovery and provenance.
- [x] Expose the existing protocol, development log and case-study text as evidence, without changing source reports or attribution.
- [x] Run build, existing browser acceptance and focused journey tests, inspect desktop/mobile screenshots, obtain independent review and prepare the local preview.

## Review focus

- Failure-report unavailability must not remove normal evidence, explanatory content or downloads.
- Missing relevant scenarios must not invent results or crash.
- Failure and normal run selection must retain the correct expectation, diagnostic, outcome and provenance.
- All stages and both interactions must work at 320px and by keyboard; old fragment links remain usable.
- Recorded PASS, FAIL and attempt counts must not be presented as fresh tests or live hardware.

## Execution record

- Using the clean main checkout on a new local `feat/diagnostics-build-journey` branch; no attached worktree exists. No publishing or commits requested.
- Default Node 22 test startup was blocked by sandbox process permissions. Bundled Node 24.19.0 outside the sandbox passed the existing 49 tests.
- The backup checkout has the identical package-lock SHA-256; reuse its installed dependencies locally without modifying the backup.
- Browser RED: the original site had no Build journey navigation. GREEN: eight focused browser checks cover the six anchors, both keyboard-driven interactions, 320–1440px reflow, failure-report outage/retry, missing scenarios, tall-screen final-stage state and supporting document URLs.
- Review fixes: copied the original normal/failure console records to resolve the development log's links; each SHA-256 matches the source. A 1440×1200 regression first reproduced the final-stage highlight failure, then passed after accounting for the document's scroll limit.
- Production build passes, including all 49 unit/contract tests, content checks and Vue type checking. Whole-site browser acceptance passes 82 checks. No project diagnostic tests were rerun; the displayed 44-pass record remains dated 8 October 2026.
- Local preview: http://127.0.0.1:4174/projects/device-diagnostics/ (hidden Node process 120144). The app browser-open request was queued for this chat. No commit, push or public deployment.
- Browser screenshots and focused report: qa/journey/. Build output: qa/journey-build.log. These generated local files are ignored; the existing whole-site qa/results.json is refreshed by its check script.
