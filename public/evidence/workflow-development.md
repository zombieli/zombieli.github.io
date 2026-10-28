# Development record

Local dates: 8–9 October 2026, UTC+8. Newly designed project; old source and real employer data were excluded by the user's instruction.

| Step | Implementation or observation | Verification |
| --- | --- | --- |
| 1 | Defined a fictional workshop, three demo assets and five statuses in `contract.json` | Python and TypeScript consume the same contract |
| 2 | Created SQLite schema 1, FastAPI models and parameterised endpoints | Invalid field types, absent assets and unknown records covered |
| 3 | Added `BEGIN IMMEDIATE`, expected-version checks and event writes in the same transaction | Injected audit-insert failure rolls back creation and status update |
| 4 | Built separate API and in-memory demo services, with explicit session-only demo wording | 25 origin/target combinations tested in each implementation |
| 5 | Added list, filters, creation, detail, required treatment note and Perth-time history | Type checking and production build passed |
| 6 | npm 10.9.2 failed resolving the Vitest 4 dependency tree with an `edgesOut` exception | Fixed Vitest to 5.0.3; installation, build and 27 unit tests passed |
| 7 | Browser selector exposed an ambiguous Status filter name | Added explicit accessible label; rerun passed |
| 8 | Exercised the static demo and the local FastAPI/SQLite service in Chrome | Both flows passed: create, assign, work, resolve, close, history and filters |
| 9 | Exercised additional failure conditions | Required resolution, reset, API persistence and network-failure draft retention passed |
| 10 | Final API regression | 37 passed in 1.23 s; one upstream Starlette warning about future httpx migration remains |

Browser results: `qa/browser-results.json`, captured 2026-10-08T16:21:01.677Z. Screenshots in `qa/` contain synthetic records. UI acceptance used 360, 390, 768 and 1440 px widths. This is not a formal accessibility audit or load test.

The initial 37-test run took 1.41 s with two warnings. The project-owned iterator warning was fixed by materialising the parameter list; the subsequent result above retains only the upstream dependency warning. No failed assertions remain in the final runs.

Public integration packages the independently built demo under the main portfolio's `/field-service-workflow/` path. The full source remains an independent project and a downloadable bundle. Remote repository publication and Actions execution remain pending GitHub connection.
