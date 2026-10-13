# Development log

Date: 13 October 2026. Version: 1.1.0.

## 1. Contract and boundaries

The initial contract required one shared domain implementation for the terminal and browser, documented normalised JSON rather than assumed compatibility with every test runner, and explicit handling of missing baseline coverage. The chosen schema uses version 1, an optional report label and exact suite/name case identities. The public result separates status, coverage and timing; this lets reviewers see recoveries without hiding persistent failures.

The implementation directory contains only this project. The published browser directory is self-contained, and the project requires no runtime packages. Node 24's native runner was chosen for a small reproducible test suite. Native subprocess tests are used because a function returning a number would not prove that the CLI actually exits with that status.

## 2. Test-first domain and CLI development

The first 45 tests were written before the implementation. They specified validation, nine status transitions, removed coverage, added skips and failures, empty candidates, deterministic ordering, timing boundaries, human output, and CLI behavior. Small placeholder exports threw explicit unimplemented errors; the CLI placeholder exited with 2. Invalid-schema assertions required the intended validation error so a blanket throwing placeholder could not produce a misleading green run.

The first command was:

```sh
node --test tests/*.test.mjs
```

The restricted execution environment initially prevented subprocess creation, reporting `spawn EPERM`. This was an execution constraint rather than a feature failure. Rerunning with local subprocess execution enabled produced the intended red run: 45 tests, 0 passed, 45 failed. The sanitised output is retained in `evidence/red-tests.txt`.

The pure module was implemented next. Identity arrays avoided delimiter collisions. Validation rejects duplicate pairs, unsupported statuses, blank identifiers and non-finite or negative timings. Rows are sorted after matching, independent of incoming case order. Coverage reasons are preserved even when failure is the primary verdict.

The CLI then delegated to this module and added argument parsing, file limits, error output and actual exit codes. The first implemented run passed 44 of 45 tests. One test expected an explicitly permitted removal to accept an empty candidate, while another required an empty candidate to stay incomplete. This was an inconsistent test expectation. The removal-override test was changed to use a nonempty candidate with a new case; the empty-candidate safeguard remained. The complete suite then passed all 45 tests.

## 3. Browser workflow and first failing check

The browser verification runner was created before the browser workspace. Against the initial local server it timed out waiting for the sample-load action, confirming the missing browser functionality. The runner uses an existing development-only Playwright installation and a local Chromium executable; neither is bundled as a runtime dependency.

The interface was built around two steps: select reports, then review changes. A navy header, warm neutral page, teal actions and restrained status colours provide a consistent visual hierarchy. There is a deliberate empty state rather than an automatic verdict. Sample reports are loaded only by an explicit action.

File replacement clears the comparison before reading begins. Per-input generation tokens prevent a late read from replacing newer input. Separate slot errors prevent a valid replacement of one file from hiding an invalid other file. Policy validation follows the same rule: an invalid threshold clears the accepted result and disables the download.

## 4. Browser failures and corrections

The first implemented browser run reached the coverage-override check and timed out trying to click a checkbox inside the collapsed policy disclosure. The UI was working as designed; the runner was corrected to open the disclosure before interacting.

The next run exposed another test expectation issue: the primary button's DOM text includes a decorative arrow while its accessible name excludes that arrow. The keyboard assertion was changed to verify focus on the primary action's identity, avoiding an assertion on decorative text.

During screenshot inspection, native file-picker text followed the desktop locale. The visible chooser was changed to an English custom display over the native, labelled file input. The native input still owns file selection and keyboard focus; `:focus-within` shows focus on the containing control. Screenshots were regenerated after the change.

The following scenarios then passed in desktop Chromium:

1. Load the bundled sample, classify eight rows and filter failures.
2. Check document overflow at 360, 390, 768 and 1440 pixels; capture 390 and 1440 full-page screenshots.
3. Import valid reports, see acceptance and download a parseable JSON artifact.
4. Replace a valid candidate with malformed JSON; clear the old verdict, rows and download.
5. Render an HTML-like hostile case name as text without creating or executing image markup.
6. Block a new skip until the explicit policy checkbox is selected.
7. Reach the primary action by keyboard and locate both labelled file inputs.
8. Delay a candidate read, replace it with invalid input, then release the older read; verify it cannot restore acceptance.
9. Enter an invalid timing ratio, remove the accepted result, then repair the ratio and recompute.

No page errors were recorded in the final browser run. This is desktop Chromium verification with responsive viewports; no physical mobile device testing was performed.

## 5. Reproducible evidence

The final evidence command runs the native suite again, captures native TAP output, executes the sample CLI and composes the verification record from actual outputs:

```sh
node scripts/browser-check.mjs
node scripts/verify.mjs
```

The browser command requires the documented `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` configuration. `BASE_URL` and `EVIDENCE_DIR` allow reuse against a hosted demo. No machine-specific executable paths are needed in the project files.

The evidence contains the failing test-first output, passing native output, passing browser scenario report, a complete sample comparison artifact and two screenshots. The sample has seven baseline and seven candidate cases, with eight identities in their union. It exits 1 because there are two candidate failures, one removal and one new skip; the recovery and timing warning do not obscure those conditions.

## 6. Limits and future improvements

This version expects normalised JSON and does not parse JUnit directly. Sample reports are fictional and timings are illustrative. The policy answers whether the candidate satisfies the stated comparison rules, not whether an entire production release is safe. Timing warnings use one measurement from each run, so confidence intervals, repeated-run aggregation and environment matching remain possible future improvements. Framework adapters and trusted baseline storage can be added around the pure core without changing browser and CLI semantics.

## 7. Review corrections and browser regressions

The subsequent review found two browser presentation/state defects. First, the failure card counted regressions plus persistent failures, excluding failures in newly added tests. The verdict and failure filter already included these failures, producing an inconsistent review screen. A new browser regression imported a passing existing test plus a newly added failure and expected the card to show one failure. Before the correction it failed with actual `0`, expected `1`. The card now uses the core's `candidateFailures` count, and the same check also verifies that the failure filter shows the added failing case.

Second, sample loading used one combined generation check for both reports. If a candidate file was selected while both sample requests were delayed, the combined guard rejected both sample responses, leaving the untouched baseline at `Loading sample…`. A regression intercepted the two sample requests, selected a valid custom candidate, and then fulfilled the delayed samples. It failed with actual `Loading sample…`, expected `Delayed sample baseline · 1 tests`.

Sample requests now settle independently. Each response or error checks only its own report generation before changing state. A replaced candidate stays intact while the untouched sample baseline finishes; the two reports then compare normally. This retains stale-read protection without abandoning unaffected input. Sample screenshots are captured after reloading the standard bundled comparison, keeping the published screenshots reproducible.

The local server had to be restarted before the regressions could run; the initial attempt reported connection refused and did not count as a reproduced product failure. Both regressions then failed for their intended assertions before their corresponding corrections. Assertion excerpts are retained in `evidence/review-regressions.txt`.

After the corrections, these commands refreshed all evidence:

```sh
node scripts/browser-check.mjs
node scripts/verify.mjs
```

The final run on 13 October 2026 passed **11 browser scenarios** with no page errors and **45 native tests** with no failures. The example CLI still returned the expected exit 1. Desktop and mobile screenshots, browser results, native TAP output and `evidence/verification.json` were regenerated from this corrected implementation.
