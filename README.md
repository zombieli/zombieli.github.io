# Leon Li portfolio

Software engineering portfolio for internship applications in Western Australia. Built with Vue 3, TypeScript and Vite. Six implemented projects are presented with runnable demonstrations, source downloads and recorded evidence; future ideas are labelled separately.

Version 1.2.0: the familiar blue-and-white presentation is refined for readability, with separate case modules, validated diagnostic evidence and the current resume. Visit the [live portfolio](https://zombieli.github.io/) or [project collection](https://zombieli.github.io/projects/). See [CHANGELOG.md](CHANGELOG.md) for the release scope and [the 1.2 development log](docs/release-1.2.md) for verification.

| Category | Implemented project | Try it |
| --- | --- | --- |
| Devices & testing | Device Diagnostics Lab | [Case and evidence viewer](https://zombieli.github.io/projects/device-diagnostics/) |
| Web applications | Field Service Workflow | [Interactive demo](https://zombieli.github.io/field-service-workflow/) |
| Data & simulation | Workshop Scheduling Study | [Recorded experiments](https://zombieli.github.io/projects/scheduling/) |
| Mobile applications | Offline Inspection Notebook | [Offline browser app](https://zombieli.github.io/demos/inspection-notebook/) |
| Cloud & developer tools | Test Report Delta | [Report comparison](https://zombieli.github.io/demos/test-report-delta/) |
| Automation & search | Technical Manual Search | [Search fictional training manuals](https://zombieli.github.io/demos/technical-manual-search/) |

## Run locally

Use Node 24. TypeScript stays at 5.9.3 for compatibility with the installed vue-tsc.

```sh
npm ci
npm run dev
# Production build and preview:
npm run build
node scripts/serve.mjs
```

Production preview: http://127.0.0.1:4173. The home page, `/projects/` collection and every published case have independent HTML entries. Unknown paths return a real 404. The existing diagnostic, field service and scheduling URLs remain unchanged; the bundled interactive demo is at `/field-service-workflow/`. This is a local preview, not a public deployment.

## Add and maintain work

```sh
npm run project:new -- equipment-check-in mobile-applications
```

This creates `content/projects/equipment-check-in.json` as a **draft**, not a completed project. Fill its description, technologies, cover, evidence links, contribution, case sections and limitations. Add the real assets under `public`, set accurate dates, and change the status to `published` when ready to display. Run `npm run build` and check the result. Restart `npm run dev` after editing catalogue files so newly generated routes are loaded.

- `content/categories.json`: category order, labels, descriptions, future ideas and optional `featuredProjectId`.
- `content/projects/*.json`: one record per project, with one primary category. Tags capture overlapping topics.
- `draft` and `archived` records are excluded from website data and routes. Clear any featured pin before archiving that project.
- The homepage selects one published project per nonempty category: an explicit pin, otherwise newest `updatedAt`, then project ID as a stable tie break. Empty categories appear as future directions in the collection.
- New projects use `renderer: standard`. `StandardCase.vue` displays structured paragraphs, lists, evidence links and limitations. No homepage or Vite configuration changes are needed.
- `src/data/catalogue.json` and `projects/<id>/index.html` are generated; edit the content records instead. The generator refuses to overwrite unowned HTML and removes only its own stale detail entries.
- Content editing is file based. There is no CMS or server database. Archiving does not remove historical assets from `public` or make a public source repository private.

The original three specialised case views live in `src/cases/DiagnosticsCase.vue`, `src/WorkflowCase.vue` and `src/SchedulingCase.vue`. The notebook, comparator and manual search use `src/cases/InspectionCase.vue`, `src/cases/DeltaCase.vue` and `src/cases/ManualCase.vue`, selected by project ID while retaining their standard catalogue records. Newly authored standard projects still use the generic renderer. Changes to detailed claims need matching edits in the case and real evidence. App owns navigation and page selection, while the homepage lives in `src/pages/HomePage.vue`. Shared personal facts are maintained in `src/data/profile.json`. See [case ownership](docs/adr/0001-case-presentation.md) and the [domain glossary](GLOSSARY.md).

Field reference, category roadmap, authoring and archiving guide: [Content maintenance](docs/content-maintenance.md).

## Validation

`npm run build` prepares content, checks the catalogue and evidence, runs catalogue/generation tests, type checks and creates production output. Source-archive checks additionally require Python 3.10 or newer (standard library only).

```sh
npx playwright install chromium
# Keep the production preview running before this command:
node scripts/browser-qa.cjs
# Interactive case-study journeys (the local preview defaults to port 4174):
node scripts/workflow-journey-qa.cjs
node scripts/workflow-fragment-qa.cjs
node scripts/scheduling-journey-qa.cjs
node scripts/inspection-journey-qa.cjs
node scripts/delta-journey-qa.cjs
node scripts/manual-journey-qa.cjs
node scripts/journey-audit.cjs
# Separate isolated authoring lifecycle test:
npm run test:authoring
# Verify downloadable source and its browser demos:
python -m unittest discover -s tests -p 'test_*.py'
python scripts/check-project-bundles.py --browser
```

Set `CHROMIUM_PATH` to a local Chrome executable if using it instead of Playwright's downloaded Chromium.

The six case journeys share `src/lib/journey-motion.ts`: explicit replay, 1.2-second steps, bounded click feedback, pause on backgrounding and live reduced-motion support. Scenario selection resets the sequence without starting playback. `journey-audit.cjs` checks all six at 320, 390, 844 and 1440 px, keyboard focus, touch targets, mobile form sizing and animation cancellation; it saves viewport screenshots and results under `qa/consistency/`.

Set `BASE_URL` to your preview address when it differs from a script's default. The Field Service journey checks cover lifecycle gates, retained history, commit/conflict/rollback diagrams, keyboard and reduced-motion interaction, responsive layouts and initial chapter links after delayed page loading. These are portfolio presentation checks; the original application's API and demo test results remain separately dated historical evidence.

The Scheduling journey replays exact saved input/timeline subsets for steady arrivals, sparse arrivals and seed 0, while the comparison offers all 22 recorded scenarios. Its tests verify subset equality, ready-job selection, validator rejection before metrics, playback cancellation, responsive layouts and cold chapter links. The presentation validator rechecks all 44 saved schedules against their recorded waiting metrics; this does not rerun the original Python experiment or replace its historical 36-test record.

The Inspection Notebook journey uses a dedicated lazy case view for the existing standard project ID, preserving the catalogue authoring contract. Its record and backup examples use an exact copy of the original pure validation module and illustrate transactions entirely in memory. Checks cover pending-write locking, failed-write input retention, immutable submissions, stale edits, atomic backup outcomes, offline scenarios, motion preferences and chapter links. These presentation checks do not replace the notebook's dated 35-domain-test / 20-browser-check evidence or change its standalone demo.

The Test Report Delta journey uses the original pure comparison module and exact bundled reports, verified against the complete saved comparison artifact. Its policy explorer adds labelled synthetic examples for coverage, added failures, empty candidates and strict timing boundaries. The read-race diagram models the browser's per-input generation guards without file or network I/O. Checks cover source equality, real comparison outcomes, stale reads, motion cancellation, keyboard focus, responsive layout and cold chapter links. Historical 45-native-test / 11-browser-scenario evidence remains dated 13 October 2026; the case-page exit codes are explanations, not newly executed CLI runs.

The Technical Manual Search journey runs the original ranking core on the unchanged 15-section corpus and exposes all 26 saved query outcomes. Tests recompute every metric and returned reference with the original evaluator (only its import path is adapted) and compare against the historical report. The p17 miss still returns the wrong missing-samples section; it is not an empty result. Browser checks cover global scoring under filters, input rejection, exact safe source text, real source-link reload, all query outcomes, motion cancellation and responsive layouts. Original 24-native-test / 17-browser-check evidence remains dated 13 October 2026, separate from new portfolio checks.

`qa/results.json`, `qa/authoring-results.json` and `qa/bundle-results.json` record actual verification runs. Browser checks cover responsive layout, category/search/sort URLs, keyboard use, menu focus, history navigation, empty states, evidence failure/retry, lazy case loading, downloads, video, workflow demo and 404 responses. The lifecycle test builds an isolated copy with an extra category and new standard case, verifies rendering and archiving, then deletes its temporary copy. It does not add sample work to the real portfolio.

The archive checker validates and extracts the three new source ZIPs into temporary directories, runs their real Node tests without installing project dependencies, and optionally exercises the demos at `BASE_URL` (default `http://127.0.0.1:4173`). It records evidence under `qa/bundle-verification/`. Each project includes architecture, development notes and verification reports. These functional checks are not a formal accessibility audit, real-device test or Lighthouse score. If retiring a case, update its specific regression scenario alongside the content change.

## Evidence and delivery

Public reports use simulated readings and faults from real local test runs. The website displays saved evidence and does not operate physical devices. The public resume includes the supplied LinkedIn profile and Student visa subclass 500, without claiming unrestricted work rights.

The workflow demo is a separately built static snapshot from the sibling `field-service-workflow/frontend` project. New demonstrations are standalone modules under `public/demos/`. Editable source, tests, development notes and verification evidence are distributed in `public/downloads/`. Extract a project ZIP and follow its README before changing the copied demo. The workspace packaging script refreshes all six allowlisted ZIPs with fixed archive metadata and records SHA-256 values in `public/evidence/release-manifest.json`.

The notebook stores data in the current browser and origin; load it online once before using its cached app offline. Clearing site storage removes those records, so export a backup before relying on them. It is a PWA, not a native Android application or a synchronised production system. The comparator accepts its documented normalised JSON schema. Search uses fictional training documents and returns source passages rather than operating advice for real equipment.

GitHub Actions includes content, build, logic, authoring and browser checks. PR checks do not have deployment permissions. Successful main-branch builds deploy to Pages using the GitHub Actions publishing source. Review [deployment workflow runs](https://github.com/zombieli/zombieli.github.io/actions) before relying on later updates. `/version.json` identifies the displayed release.

Release scope is recorded in [CHANGELOG.md](CHANGELOG.md). Dependencies remain pinned through `package-lock.json`; no production dependency was added for the catalogue.
