# Changelog

## 1.1.0 — 2026-10-13

Three runnable projects complete the first example in each of the six portfolio categories:

- **Offline Inspection Notebook:** mobile-first PWA, IndexedDB drafts, fixed submitted records, scoped offline cache and atomic JSON backup import. 35 domain tests and 20 browser checks.
- **Test Report Delta:** one comparison core for the browser and Node CLI, explicit coverage policies, actual exit codes and safe report replacement. 45 native tests and 11 browser scenarios.
- **Technical Manual Search:** lexical retrieval with exact source paragraphs, shareable filters and a reproducible evaluation. 24 native tests, 17 browser checks and 26 labelled queries.

The homepage now shows one project in every category. Completed categories retain separately labelled future ideas. Each new case provides a demo, source archive, verification record and detailed development log. Standard cases put these links near the top. The content-authoring examples use an unused project ID.

Validation: 19 catalogue/generation tests, 8 archive validation tests, 59 portfolio browser checks and 5 authoring lifecycle checks passed locally. All three new source ZIPs were extracted into temporary directories; their 104 native tests and 48 browser checks passed against the staged site. CI now repeats source-archive and demo verification before deployment. See [development and verification records](docs/release-1.1.md).

Search evaluation retains one missed positive query and four lexical false positives among eight negative queries. All project data is fictional or synthetic. The notebook is a browser PWA; physical mobile devices, native installation prompts and production systems were not verified. The 1.0 tag and release remain available.

## 1.0.0 — 2026-10-10

First public release at [zombieli.github.io](https://zombieli.github.io/).

- Portfolio home, personal introduction, LinkedIn, contact and downloadable resume.
- Three implemented projects: Device Diagnostics Lab, Field Service Workflow and Workshop Scheduling Study.
- Six project categories, search, sorting and shareable filtered URLs.
- One representative project per populated homepage category, with pinned or automatic selection.
- File-based content authoring, drafts, archiving, automatic static routes and a standard case-study template.
- Recorded evidence, reproducible source downloads, a subtitled walkthrough and an interactive synthetic workflow demo.
- Responsive layouts, keyboard navigation, readable error states and a real 404 page.

Validation: 19 rule/generation tests, 47 local browser checks and 5 authoring lifecycle checks. The first GitHub Actions deployment passed; another 47 checks passed against the public site. The online version file reports 1.0.0, and all three downloaded source bundles match the recorded hashes.

Device and workshop data are synthetic. The workflow browser demo uses in-memory data that resets on refresh. Physical hardware, production operation and a formal accessibility audit have not been verified.
