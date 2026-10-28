# Portfolio 1.3 — six interactive build journeys

Prepared on 28 October 2026 after the owner requested committing, pushing and publishing the six case journeys and their mobile refinements.

Each featured case now has six source-backed stages and interactive, project-specific diagrams. Shared motion controls use explicit replay, 1.2-second steps, finite feedback and cancellation on reduced-motion preferences or backgrounding. Small controls and mobile input fonts were corrected while preserving the existing visual style and URLs.

## Local release verification

- Production build, content/archive integrity checks, TypeScript and all 90 portfolio logic tests passed.
- Eight source archive validator tests and five isolated content-authoring checks passed.
- Existing browser regressions: 82 whole-site checks and 69 project journey checks passed during the completed UI review.
- The shared release audit was rerun: 24 route/viewport combinations, all 36 stage buttons, all 11 replayable diagrams and six touch-emulated cases passed with no page errors.
- Downloadable source was extracted and tested again: Inspection Notebook 35 tests, Test Report Delta 45 tests and Technical Manual Search 24 tests; all three browser suites passed against the staged site. Fresh reports are in `qa/authoring-results.json` and `qa/bundle-results.json`.

Mobile coverage uses Chromium narrow-screen and touch emulation, including 320/390 px portrait and 844 px landscape. Physical iOS devices were not tested. Recorded project evidence keeps its original dates and remains separate from this portfolio release verification.

## Publication

`main` is the existing Pages publication branch. `.github/workflows/pages.yml` now includes all journey and cross-project audits before uploading the Pages artifact. The deploy job depends on the check job. Package and served version metadata identify this release as `1.3.0`.

The canonical site is <https://zombieli.github.io/>. Deployment status must be checked on the exact pushed commit, then the served version and all six case pages must be verified before reporting publication complete.
