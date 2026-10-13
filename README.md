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

The original three specialised case views live in `src/cases/DiagnosticsCase.vue`, `src/WorkflowCase.vue` and `src/SchedulingCase.vue`; changes to their detailed claims need matching edits there and to the real evidence. App owns navigation and page selection, while the homepage lives in `src/pages/HomePage.vue`. Shared personal facts are maintained in `src/data/profile.json`. See [case ownership](docs/adr/0001-case-presentation.md) and the [domain glossary](GLOSSARY.md).

Field reference, category roadmap, authoring and archiving guide: [Content maintenance](docs/content-maintenance.md).

## Validation

`npm run build` prepares content, checks the catalogue and evidence, runs catalogue/generation tests, type checks and creates production output. Source-archive checks additionally require Python 3.10 or newer (standard library only).

```sh
npx playwright install chromium
# Keep the production preview running before this command:
node scripts/browser-qa.cjs
# Separate isolated authoring lifecycle test:
npm run test:authoring
# Verify downloadable source and its browser demos:
python -m unittest discover -s tests -p 'test_*.py'
python scripts/check-project-bundles.py --browser
```

Set `CHROMIUM_PATH` to a local Chrome executable if using it instead of Playwright's downloaded Chromium.

`qa/results.json`, `qa/authoring-results.json` and `qa/bundle-results.json` record actual verification runs. Browser checks cover responsive layout, category/search/sort URLs, keyboard use, menu focus, history navigation, empty states, evidence failure/retry, lazy case loading, downloads, video, workflow demo and 404 responses. The lifecycle test builds an isolated copy with an extra category and new standard case, verifies rendering and archiving, then deletes its temporary copy. It does not add sample work to the real portfolio.

The archive checker validates and extracts the three new source ZIPs into temporary directories, runs their real Node tests without installing project dependencies, and optionally exercises the demos at `BASE_URL` (default `http://127.0.0.1:4173`). It records evidence under `qa/bundle-verification/`. Each project includes architecture, development notes and verification reports. These functional checks are not a formal accessibility audit, real-device test or Lighthouse score. If retiring a case, update its specific regression scenario alongside the content change.

## Evidence and delivery

Public reports use simulated readings and faults from real local test runs. The website displays saved evidence and does not operate physical devices. The public resume includes the supplied LinkedIn profile and Student visa subclass 500, without claiming unrestricted work rights.

The workflow demo is a separately built static snapshot from the sibling `field-service-workflow/frontend` project. New demonstrations are standalone modules under `public/demos/`. Editable source, tests, development notes and verification evidence are distributed in `public/downloads/`. Extract a project ZIP and follow its README before changing the copied demo. The workspace packaging script refreshes all six allowlisted ZIPs with fixed archive metadata and records SHA-256 values in `public/evidence/release-manifest.json`.

The notebook stores data in the current browser and origin; load it online once before using its cached app offline. Clearing site storage removes those records, so export a backup before relying on them. It is a PWA, not a native Android application or a synchronised production system. The comparator accepts its documented normalised JSON schema. Search uses fictional training documents and returns source passages rather than operating advice for real equipment.

GitHub Actions includes content, build, logic, authoring and browser checks. PR checks do not have deployment permissions. Successful main-branch builds deploy to Pages using the GitHub Actions publishing source. Review [deployment workflow runs](https://github.com/zombieli/zombieli.github.io/actions) before relying on later updates. `/version.json` identifies the displayed release.

Release scope is recorded in [CHANGELOG.md](CHANGELOG.md). Dependencies remain pinned through `package-lock.json`; no production dependency was added for the catalogue.
