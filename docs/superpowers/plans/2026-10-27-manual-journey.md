# Technical Manual Search journey

Continue the user's approved six-stage case-study form for the sixth project. Preserve the blue/white English portfolio, Vue/TypeScript, prior uncommitted work and local preview. No dependencies, publication or original demo changes. Same palette: blue #1d4ed8, ink #172033, muted #536078, line #d6dfeb, surface #fff, canvas #f8fafc. Inherit Inter/Arial and sticky chapter navigation.

Source audit: sibling technical-manual-search core, state, app, CLI, metrics, corpus, labels, architecture, README, development log and recorded verification. Three fictional manuals, 15 sections. Historical 24 native tests / 17 browser checks dated 13 October 2026. Positive 17/18 at rank one, p17 paraphrase miss; negative 4/8 lexical false positives. Scores are ordering values, not answer confidence.

Design: six stages question / corpus / ranking / sources / evaluation / reproduce. Map pictograms depict query, reference library, ranking bars, attributed source, labelled evaluation and reproducibility. Main retrieval explorer runs an unmodified original pure core against the original corpus. Editable query and intersecting manual/category filters, clickable token/index/rank stages, finite replay, score bars and exact-source disclosure. Query repetition is deduplicated; filters retain global statistics. Source diagram explains stable reference → shareable URL → exact paragraph using actual CSV/literal-label/unsupported-question examples, safe highlighted text and an actual source link. Evaluation explorer shows all 26 saved query outcomes as clickable tiles, grouped into honest positive and negative denominators; selection exposes labels vs returned references, the paraphrase miss and unsupported overlap. Do not change benchmark by filtering the view.

Steps:
- [x] Audit source; copy core, URL module, original corpus/labels/evaluation and evidence docs.
- [x] Add declarations and small presentation helpers with source/provenance and behavior tests.
- [x] Implement overview, retrieval, attribution and evaluation interactions.
- [x] Integrate six chapters, existing demo/evidence and cold fragment restoration.
- [x] Build, targeted browser checks, full regression and desktop/mobile visual review.
- [x] Record validation and open local preview.

Native keyboard controls, 44px targets, runtime reduced-motion cancellation and cleanup, no autoplay, widths 320/390/768/1440. Keep complete original source text, synthetic evidence labels and historic metrics. Page interactions stay in memory; source links navigate to the separate original demo with its native URL-state behavior.

## Verification and review

`npm run build` passed all 90 logic tests, content/archive validation, TypeScript and production compilation. `scripts/manual-journey-qa.cjs` passed 11 browser groups, including all 26 original outcomes, exact literal source rendering, actual original-demo source-link reload, filter score stability, query bounds, playback and keyboard/reduced-motion behavior. Four diagram layouts checked at 320/390/768/1440 px; desktop/mobile captures inspected, with an actual viewport capture confirming the fixed skip link stays off screen. Existing `scripts/browser-qa.cjs` passed 82 regression groups.

Two checks corrected assumptions rather than altering the original retrieval engine: p17 returns `cedar-logger#missing-samples` through “readings” while missing the labelled CSV export section, so its test and page wording preserve that distinction; filter labels were made explicit with for/id associations after browser lookup exposed option text being included in implicit labels. The original corpus, core, state and saved evidence remain unchanged. Evaluation is reproduced with original metrics code except its module import path. Preview: `http://127.0.0.1:4174/projects/technical-manual-search/#manual-build-map`.
