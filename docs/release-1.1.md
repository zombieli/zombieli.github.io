# Version 1.1 development and verification

Date: 13 October 2026.

## Scope

The existing portfolio had six categories and work in three of them. This release adds a runnable example to each remaining category, using the existing file-based catalogue and standard case renderer. The original project URLs remain available. All new demonstrations run on static hosting without runtime packages or external accounts.

| Category | Project | Development record | Native tests | Browser checks |
| --- | --- | --- | --- | --- |
| Mobile applications | Offline Inspection Notebook | [Record](../public/evidence/inspection-notebook-development.md) | 35 | 20 |
| Cloud & developer tools | Test Report Delta | [Record](../public/evidence/test-report-delta-development.md) | 45 | 11 |
| Automation & search | Technical Manual Search | [Record](../public/evidence/technical-manual-search-development.md) | 24 | 17 |

Each source ZIP includes its README, architecture, schemas or data contracts, executable tests, actual development failures and fixes, structured verification and screenshots. The project-level logs distinguish assertion failures from environment failures and explain corrections to test expectations.

## Development sequence

1. Define the public demonstration boundary, file contract and invariants for each project. Choose a browser PWA for immediate inspection, a shared browser/CLI comparison core and attributable lexical retrieval over fictional source material.
2. Write domain and CLI tests before implementing the corresponding behavior. Preserve observed failing output and subsequent verification. Implement the browser workflows and test persistence, input replacement, source display and URL state.
3. Review beyond the initial passing suites. A pending IndexedDB save could overwrite later typing; the fix locks the editor during persistence, with real blocked-transaction regressions for Save and Submit. The report summary omitted added failures and overlapping sample loads could strand an input; both were reproduced and fixed with browser regressions.
4. Populate the three existing categories, pin one representative per category and preserve a labelled roadmap for further work. Generate all case routes from their content records and copy the self-contained demos.
5. Package explicit source allowlists with fixed archive metadata. Record SHA-256 hashes. Extract the final downloadable files into fresh temporary directories, run their tests and check the staged demos with the browser runners contained in those archives.
6. Build, type-check and verify the portfolio, including category URLs, keyboard use, responsive layouts, evidence links, 404 handling and isolated draft/publish/archive authoring. Inspect desktop/mobile screenshots and audit the public text and nested archives.
7. Publish through the existing GitHub Actions/Pages workflow and identify the release with `v1.1.0`. Deployment and public-site acceptance are checked separately from local project evidence.

## Recorded checks

- `qa/results.json`: 59 portfolio checks across 360, 390, 768 and 1440 pixel widths.
- `qa/authoring-results.json`: five content-authoring lifecycle checks in an isolated copy.
- `qa/bundle-results.json`: actual source hashes, native test totals and browser totals for the three new downloadable projects.
- `public/evidence/release-manifest.json`: SHA-256, byte size and member count for all six project archives.
- `public/evidence/*-verification.json`: project-level methods, measured results and limitations. Referenced detailed files are inside each source ZIP.

The build also runs 19 catalogue/generation tests. Eight Python tests check extraction boundaries, duplicate names, symlinks and archive budgets. CI repeats these checks and the browser acceptance before a Pages deployment. Portable commands and dependencies are documented in the repository README and each project archive.

## Evaluation and limits

Manual search uses three fictional manuals and fifteen sections. The 26-query set contains 18 positive and eight negative queries. Positive MRR, recall@5 and hit@5 are 0.944444; one paraphrase remains a miss. Four negative queries return lexical matches, a false-positive rate of 0.5. These are small project-authored labels, not an independent benchmark. The [full evaluation](../public/evidence/technical-manual-search-evaluation.json) keeps every query and result.

Browser verification uses desktop Chromium with resized viewports. It does not establish physical-phone behavior, native install prompts, a formal accessibility audit or production readiness. Notebook records remain local to a browser origin and require exported backups. The comparator accepts a documented normalised JSON schema and treats timing changes as advisory. The search interface exposes source passages and cannot determine whether lexical overlap answers a question.
