# Offline Inspection Notebook: interactive development journey

Continue the user's approved case-study form on the fourth featured project. Maintain existing Vue/TypeScript, English copy, blue/white tokens, fonts and sidebar reading layout. No new dependencies, commits, publication, original-demo changes or real storage operations.

## Design

Six actual development stages: define local records; protect the record lifecycle; prepare offline availability; restore backups atomically; challenge failure boundaries; package and reproduce. These are editorial groupings of the recorded work, not individual commits.

- Six-node map: custom record/checklist/cache/import/test/package illustrations select source-grounded artifacts and chapter links, with finite connector animation.
- Record explorer: an in-memory fictional editor uses an unmodified copy of the project's pure core. Visitors save drafts, encounter incomplete-submit gates, inspect pending writes that lock inputs, complete or fail the held write, and submit a complete read-only record. Clickable state nodes inspect rules; changes use explicit controls. No notebook IndexedDB access. The held pending step is deliberately manual so the protection is inspectable.
- Offline diagram: select first-visit offline, prepared offline and unavailable-record-storage cases. Separate the service-worker shell cache from IndexedDB records. Explain initial online preparation and active control, scoped GET handling and no upload/sync. Selecting a case changes an explanation, not actual connectivity.
- Import explorer: animate validation, capacity/identity handling, queued adds and commit/abort. Show pending IDs separately from committed IDs. Successful import, existing-ID conflict with new IDs on both sides, invalid backup and capacity rejection use synthetic examples grounded in source rules. Never imply partial success or overwrite.

Prefer these specific record and transaction interactions over repeating a generic architecture animation. Keep the original demo, source, verification/development evidence and limitations available. Historical 35 domain tests and 20 browser checks stay dated 13 October 2026. Blue #1d4ed8, ink #172033, muted #536078, line #d6dfeb, white #ffffff and canvas #f8fafc stay consistent with the portfolio.

The content record remains valid standard content; App selects a dedicated lazy case component for inspection-notebook before the generic renderer. This keeps the catalogue/generator contract and other standard projects unchanged. Extend existing initial-fragment restoration to this case.

## Work

- [x] Audit source, docs and dated evidence; copy pure core and supporting documents without alteration.
- [x] Implement record lifecycle explorer and meaningful state/lock tests.
- [x] Implement atomic import explorer and meaningful commit/rollback tests.
- [x] Integrate map, offline explanation, six stages and cold chapter navigation.
- [x] Run build, targeted browser checks and existing project regressions; inspect mobile/desktop screenshots.
- [x] Independent review, resolve findings and provide local preview.

## Verification · 27 October 2026

`npm run build` passed content/bundle validation, all 78 logic tests, TypeScript and production compilation. `scripts/inspection-journey-qa.cjs` passed 12 browser check groups at 320/390/768/1440 px, including source-backed gates, pending locks, failure retention, stale edits, import outcomes, live reduced motion, delayed fragment restore and no IndexedDB/service-worker side effects. The existing `scripts/browser-qa.cjs` passed all 82 regression check groups. Inspected desktop and mobile map/record/offline/import captures. Independent source and accessibility review found no actionable issue. The copied pure core equals the original demo source after normalizing CRLF/LF line endings. Preview: `/projects/inspection-notebook/#inspection-build-map` on local port 4174.

## Boundaries and verification

Check completion requirements, pending-input lock, submitted immutability, failure input retention, no implicit autosave, timestamp conflict behavior where shown, parse-before-storage, duplicate rollback, capacity and first-error preservation. Native controls, 320/390/768/1440px layouts, keyboard interaction, finite motion, runtime reduced-motion response and timer cleanup. Keep actual service worker and IndexedDB entirely inside the separate existing demo. Original 35/20 verification is not a new rerun.
