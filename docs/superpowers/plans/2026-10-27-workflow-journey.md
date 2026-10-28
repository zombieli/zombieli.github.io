# Field Service Workflow: interactive development journey

The user requested continuing the approved first-project presentation on the second project, with diagrams grounded in the source and the existing website style. Implement in the existing Vue/TypeScript portfolio checkout, preserve the first project and existing source/demo downloads. Local preview only.

## Design

Six editorial stages follow the actual implementation: scope a traceable work order; define the shared lifecycle contract; separate browser and API services; protect writes with versions and transactions; test invalid paths and recovery; package the demo, source and evidence. They group the development record rather than claim six historical commits.

Keep the current blue/white palette (#1d4ed8, #172033, #536078, #d6dfeb, #ffffff, #f8fafc), existing font variables, left-aligned reading column and sticky chapter navigation. A six-node illustrated map selects a deliverable and chapter link. A service-mode diagram highlights the selected browser-memory or FastAPI/SQLite path.

Two main interactive diagrams:

1. Lifecycle explorer: use the real contract. Let visitors advance a synthetic order through five states, see required assignment/resolution gates and a Resolved-to-Open return. Clickable states inspect rules without silently changing the order. Show current fields and versioned history, including clear-on-reopen and Closed terminal behavior. Motion traces only a successful change, and respects reduced motion.
2. Write-safety explainer: select accepted write, stale version or event-insert failure; play/pause or select individual steps. The database row and event count commit together or remain unchanged. Mark this as a source-backed explanation of local API behavior, not a live database or recorded network trace. Cancellation on scenario change, no initial autoplay, reduced motion stops timers.

This fits the request better than duplicating the entire app or showing a generic architecture-only animation. Retain the full demo as a separate link. All explanatory sample values are explicitly synthetic. Historical 37 API / 27 frontend tests and browser acceptance remain dated 8–9 October 2026; new portfolio checks are recorded separately.

## Work

- [x] Inspect source, docs and recorded evidence; choose concrete stages and interaction contracts.
- [x] Implement contract-based lifecycle explorer with meaningful rule tests.
- [x] Implement atomic-write/version-conflict explorer with meaningful outcome tests.
- [x] Integrate six-stage story, clickable map, mode diagram and source evidence links.
- [x] Build and run targeted browser checks, first-project regression and whole-site regression.
- [x] Review desktop/mobile screenshots and independent code review; deliver local preview.

## Verification

Check allowed/blocked status changes, required fields, reopen cleanup with retained history, terminal Closed, conflict rejection before writes, atomic rollback, playback cancellation, reduced motion, keyboard interaction, 320/390/768/1440px reflow, supporting links and demo preservation. No new dependencies, public deployment, source-project changes or data mutations.

Verified 27 October 2026:

- Observed failing model tests before the new modules existed and a failing browser check before the page contained a workflow map.
- Production build passes content/bundle validation, TypeScript and 57 tests (including 8 new presentation-model tests).
- 9 workflow journey browser groups pass, covering lifecycle gates, all saved-value invariants, playback completion/cancellation, keyboard operation, reduced motion and four viewport widths.
- Independent review identified a delayed-loading initial-fragment race. Reproduced it before extending the existing ready/fragment mechanism to Workflow; both cold-link tests now pass.
- 82 whole-site checks pass on the final build. The existing first-project suites also pass 8 journey checks and 6 animated-diagram groups.
- Inspected mobile/desktop map, service, lifecycle and transaction screenshots, including the uncommitted event-insert failure. No visual issues remain.
- Shared contract and three public evidence copies match their source SHA-256. The app's recorded 37 API / 27 demo tests were not rerun or represented as new results.
- `git diff --check` passes. Results/screenshots are under ignored `qa/workflow-journey/`; build log is `qa/workflow-build.log`.

Local preview: http://127.0.0.1:4174/projects/field-service/#workflow-build-map. No commit, push or public deployment performed.
