# Portfolio content maintenance

This guide describes how to add, update and archive projects without editing the homepage layout or Vite entry list. Content is stored in version-controlled JSON files; no database or management account is required.

## Collection and categories

The homepage presents one published project from each populated category. The full collection at `/projects/` supports category filters, keyword search and sorting. Search matches project titles, summaries, technologies, tags and category names. Multiple words must all match.

Filters are saved in the URL. For example, `/projects/?category=web-applications&q=workflow&sort=title` opens a specific search. Reload and browser history retain those filters. Changing category keeps the search terms; use the reset action to return to the full collection.

| Category ID | Display name | Current work | Possible additions |
| --- | --- | --- | --- |
| `devices-testing` | Devices & testing | Device Diagnostics Lab | Serial protocol harness; hardware-in-the-loop fault testing |
| `web-applications` | Web applications | Field Service Workflow | Offline inspection workflow; equipment maintenance dashboard |
| `data-simulation` | Data & simulation | Workshop Scheduling Study | Sensor quality study; maintenance scheduling comparison |
| `mobile-applications` | Mobile applications | Offline Inspection Notebook | Native Android client; QR equipment check-in |
| `cloud-developer-tools` | Cloud & developer tools | Test Report Delta | Release and rollback lab; report-format adapters |
| `automation-search` | Automation & search | Technical Manual Search | Version-aware manual references; rule-based report classification |

Every project has one primary category. Use tags for topics that overlap categories. Empty categories appear as labelled future directions with ideas, not completed project cards. Once the first project is published in a category, it enters the homepage and leaves the future-only section automatically.

## Homepage selection

1. Categories appear in the order of `content/categories.json`.
2. Only projects with `status: published` are eligible.
3. A category's `featuredProjectId` selects a specific published project from that category. Invalid pins stop the build.
4. With `featuredProjectId: null`, the most recently updated project is selected. Equal dates are resolved by project ID in English alphabetical order.
5. Categories with no published work do not produce homepage cards.

All six categories currently pin their corresponding project. Set a pin to `null` to let a newer project replace it automatically. Populated categories retain their ideas in a separately labelled roadmap.

## File responsibilities

| Path | Purpose |
| --- | --- |
| `content/categories.json` | Category labels, descriptions, order, homepage pins and future ideas |
| `content/projects/<id>.json` | One project's metadata, links and standard case content |
| `public/media/` | Covers, screenshots, video and captions |
| `public/evidence/` and `public/downloads/` | Reports, datasets and source bundles |
| `scripts/new-project.mjs` | Creates a draft without overwriting an existing record |
| `scripts/catalogue.mjs` | Validates records and generates published data and routes |
| `src/data/catalogue.json` | Generated public data; do not edit manually |
| `projects/<id>/index.html` | Generated static detail entry; do not edit manually |
| `src/components/ProjectCard.vue` | Shared homepage and collection card |
| `src/components/FeaturedProjects.vue` | Homepage selection and presentation |
| `src/components/ProjectLibrary.vue` | Filters, search, sorting, URL state and empty states |
| `src/components/StandardCase.vue` | Standard detail template for future projects |
| `src/lib/catalogue.ts` | Selection, search, sorting and URL rules |
| `src/catalogue.css` | Catalogue and standard-case styles |
| `qa/results.json` and `qa/authoring-results.json` | Recorded verification results |

The original three specialised cases retain their interactive views in `src/App.vue`, `src/WorkflowCase.vue` and `src/SchedulingCase.vue`. Update their detailed claims and actual evidence together. Their cards and categories are data-driven; new projects use the standard template.

## Add a project

Use Node 24 and install dependencies with `npm ci`. From the website directory:

```sh
npm run project:new -- equipment-check-in mobile-applications
```

This creates `content/projects/equipment-check-in.json` with draft status. It creates a content template, not a completed application. The example ID is not an existing project.

1. Implement the project and collect reproducible evidence.
2. Add a suitable cover under `public/media/`. Identify illustrations and synthetic data accurately.
3. Add reports, downloads or a working HTTPS repository/demo link.
4. Complete the fields listed below and replace all draft placeholders.
5. Set accurate publication/update dates and change the status to `published` when ready.
6. Run `npm run build` to validate content, run tests, type-check and produce static pages.
7. Start `node scripts/serve.mjs` and inspect the homepage, category, new case and evidence links.
8. Run browser acceptance and record the actual result. Add checks for any new custom interaction.

Restart `npm run dev` after changing content files so new routes are regenerated. The production preview reads `dist`; it requires a new build after edits.

## Record fields

| Field | Required content |
| --- | --- |
| `id` | Lowercase letters, digits and hyphens; matches filename and permanent `/projects/<id>/` path |
| `title` | Clear project name |
| `categoryId` | An existing category ID |
| `status` | `draft`, `published` or `archived` |
| `publishedAt` | First publication date, `YYYY-MM-DD` |
| `updatedAt` | Last substantive update, no earlier than publication; controls sorting and automatic selection |
| `summary` | One or two sentences about the problem and implemented result |
| `technologies` | Technology names, such as Kotlin, Android and SQLite |
| `tags` | Searchable topics, such as Offline and Inspection |
| `proof` | A short statement supported by actual evidence, not a target result |
| `cover.src` | Absolute site path such as `/media/equipment-check-in.webp`, without the `public` prefix |
| `cover.alt` | Description of the image and any illustrative or simulated content |
| `cover.fit` | `contain` for complete charts; `cover` for a top-aligned interface crop |
| `renderer` | Use `standard` for new projects |
| `links` | At least one object with a readable `label` and local absolute path or HTTPS `href` |
| `caseStudy.role` | Accurate description of responsibilities and collaboration |
| `caseStudy.context` | Intended users, problem, scope and environment |
| `caseStudy.sections` | Sections with `heading`, `paragraphs` and optional `bullets`; cover problem, implementation, verification and reproduction |
| `caseStudy.limitations` | At least one clear limitation or unverified condition |

Standard sections use plain text and lists rather than arbitrary HTML. Link to an independent demo for specialised interactions. A new custom renderer requires matching validation, types and browser checks.

## Update, move and archive

Change category display names or order in `content/categories.json`. Keep IDs stable because they appear in shared URLs. A new category needs `id`, `label`, `description`, `featuredProjectId` and an `ideas` array. Use `null` for an unpinned category.

To move a project, update its `categoryId` and clear any pin in its previous category. To hide or archive it, change the status and clear its pin before rebuilding. Counts and cards update automatically. The generator removes only its own marked HTML entries; unrelated manually authored pages are not overwritten. Restore published status and rebuild to restore the case.

Archiving removes the case route and catalogue record, but does not remove historical downloads or independent demos from `public`. To withdraw a resource, remove that resource and its references separately. Draft exclusion applies to built pages; files committed to a public source repository are still public.

## Verification and deployment

```sh
npm run build
node scripts/serve.mjs
# In another terminal:
node scripts/browser-qa.cjs
npm run test:authoring
```

Browser tests require Playwright Chromium or a local Chrome executable specified by `CHROMIUM_PATH`.

The build checks references, dates, required content, homepage pins, local resources, source-bundle hashes and original project evidence. The 19 rule/generation tests cover selection, filtering, drafts, routes, archiving and overwrite protection. The browser checks cover four viewport widths, shared filters, history navigation, empty states, the original cases, downloads and 404 responses. The 5 authoring lifecycle checks build an isolated copy with a temporary category and project, verify it in a browser, then remove the copy.

HTTPS link syntax is checked automatically; verify access to new external links manually. If intentionally retiring an original case, update its specialised acceptance scenario as part of the same change.

Push verified updates to `main` to trigger GitHub Actions. Confirm the workflow succeeds, then inspect the affected public pages and downloads. Update `package.json`, `package-lock.json`, `public/version.json` and the changelog together when creating a new release. These functional checks are not a formal accessibility or performance audit.
