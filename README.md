# Leon Li portfolio

Software engineering portfolio for internship applications in Western Australia. Built with Vue 3, TypeScript and Vite. Three implemented projects are presented with their actual local evidence; future ideas are labelled separately.

Version 1.0.0, published 10 October 2026: a maintainable catalogue, six categories, search, sorting and one homepage representative per populated category. Visit the [live portfolio](https://zombieli.github.io/) or [project collection](https://zombieli.github.io/projects/). See [CHANGELOG.md](CHANGELOG.md) for the release scope.

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
npm run project:new -- inspection-notebook mobile-applications
```

This creates `content/projects/inspection-notebook.json` as a **draft**, not a completed project. Fill its description, technologies, cover, evidence links, contribution, case sections and limitations. Add the real assets under `public`, set accurate dates, and change the status to `published` when ready to display. Run `npm run build` and check the result. Restart `npm run dev` after editing catalogue files so newly generated routes are loaded.

- `content/categories.json`: category order, labels, descriptions, future ideas and optional `featuredProjectId`.
- `content/projects/*.json`: one record per project, with one primary category. Tags capture overlapping topics.
- `draft` and `archived` records are excluded from website data and routes. Clear any featured pin before archiving that project.
- The homepage selects one published project per nonempty category: an explicit pin, otherwise newest `updatedAt`, then project ID as a stable tie break. Empty categories appear as future directions in the collection.
- New projects use `renderer: standard`. `StandardCase.vue` displays structured paragraphs, lists, evidence links and limitations. No homepage or Vite configuration changes are needed.
- `src/data/catalogue.json` and `projects/<id>/index.html` are generated; edit the content records instead. The generator refuses to overwrite unowned HTML and removes only its own stale detail entries.
- Content editing is file based. There is no CMS or server database. Archiving does not remove historical assets from `public` or make a public source repository private.

The original three specialised case views remain in `App.vue`, `WorkflowCase.vue` and `SchedulingCase.vue`; changes to their detailed claims need matching edits there and to the real evidence. Their catalogue cards and categories are now data driven.

Field reference, category roadmap, authoring and archiving guide: [Content maintenance](docs/content-maintenance.md).

## Validation

`npm run build` prepares content, checks the catalogue and original evidence, runs 19 logic/generation tests, type checks and creates production output.

```sh
npx playwright install chromium
# Keep the production preview running before this command:
node scripts/browser-qa.cjs
# Separate isolated authoring lifecycle test:
npm run test:authoring
```

Set `CHROMIUM_PATH` to a local Chrome executable if using it instead of Playwright's downloaded Chromium.

Latest verified results: **19 rule/generation tests, 47 browser checks and 5 authoring lifecycle checks passed**. `qa/results.json` and `qa/authoring-results.json` record the actual runs. Browser checks cover four widths, category/search/sort URLs, keyboard use, history navigation, empty states, the original report viewer, evidence-fetch failure, downloads, video, workflow demo and 404 responses. The lifecycle test builds an isolated copy with an extra test category and a new standard case, verifies the rendered page and archiving, then deletes its temporary copy. It does not add sample work to the real portfolio.

The first public deployment also passed all 47 browser checks against https://zombieli.github.io, and all three downloaded source bundles matched the recorded SHA-256 hashes. These checks are not a formal accessibility audit or Lighthouse score. New external links still need a manual availability check. If intentionally retiring one of the original three cases, update its specific browser regression scenario alongside the content change.

## Evidence and delivery

Public reports use simulated readings and faults from real local test runs. The website displays saved evidence and does not operate physical devices. The public resume includes the supplied LinkedIn profile and Student visa subclass 500, without claiming unrestricted work rights.

The workflow demo is an independently built static snapshot from the sibling `field-service-workflow/frontend` project. The workspace script `portfolio-docs/package_evidence.py` refreshes the original three projects' demo, evidence and allowlisted source ZIPs. The release manifest records hashes that the content checker verifies. Content-only catalogue edits do not need those projects repackaged.

GitHub Actions includes content, build, logic, authoring and browser checks. PR checks do not have deployment permissions. Successful main-branch builds deploy to Pages using the GitHub Actions publishing source. Review [deployment workflow runs](https://github.com/zombieli/zombieli.github.io/actions) before relying on later updates. `/version.json` identifies the displayed release.

Release scope is recorded in [CHANGELOG.md](CHANGELOG.md). Dependencies remain pinned through `package-lock.json`; no production dependency was added for the catalogue.
