# Development log

Date: 13 October 2026. Release: 1.1.0.

## 1. Scope and implementation contract

The approved scope was a static technical-reference search demonstration with a shared Node/browser core, fictional manuals, reproducible ranking evidence and clear source attribution. It needed to run directly on a static host at `/demos/technical-manual-search/`. Runtime packages and remote services would make the review experience harder to reproduce, so the implementation uses native modules, the Node test runner and ordinary DOM APIs.

The core interface was fixed before implementation: `tokenize`, `validateCorpus`, `buildIndex`, `search` and `excerpt`. Results carry manual ID, section ID, title, revision, category, exact source text, excerpt and matched terms. URL serialization lives in a separate pure module. The UI exposes the complete paragraph instead of constructing an answer from excerpts.

## 2. Search test contract before implementation

Thirteen tests were written against temporary stub functions before the core was implemented. They specified normalization and stopwords, literal HTML-like tokenization, section ID scope, duplicate IDs, schema bounds, a specific replacement ranking, query deduplication, zero-match behavior, query/result bounds, intersecting filters, stable ties, input-order independence, exact source attribution and excerpt positioning.

First command: `node --test`. The environment initially denied creation of test-worker subprocesses. This was a harness permission failure, so it was not counted as a search behavior failure. The rerun with local subprocess permission produced **13 tests: 2 passed, 11 failed**. The failures were expected assertions against the missing tokenization, validation, ranking and excerpt behavior. The two naturally empty-result tests passed against the stub; they became regression checks when the real implementation was added.

The core then used a private frequency-map index, Unicode NFKC tokenization, global BM25-style statistics, heading repetition and reference-based tie ordering. The next full run produced **13 passed, 0 failed**. The query-boundary test was later extended to cover the 64-unique-term limit already included in the core contract.

## 3. Corpus and ranking choices

Three original fictional manuals were written as useful but bounded training exercises: Aurora B7 Training Beacon, Cedar L2 Training Data Logger and Mariner C4 Training Service Cart. Each has five stable sections, for fifteen total. The manuals span field equipment, data handling and workshop practice. Each paragraph has enough content for meaningful lexical retrieval and includes explicit classroom/fictitious scope.

The corpus includes a literal markup-like session label to exercise source display safety. Manual IDs remain globally unique; section IDs only need uniqueness within their manual. Text is copied exactly into results, while normalized terms are used solely for ranking.

A section heading contributes twice to term frequency. This is a transparent modest weighting choice rather than a learned parameter. Filters retain global document statistics. Matching uses OR over deduplicated terms; a partial match is possible and must not be presented as an answer-confidence score. No threshold was fitted to the evaluation set.

## 4. Query URL state

Three URL-state tests were written before the module implementation. `node --test tests/state.test.mjs` produced **3 failed** against the stub: query/filter round-trip, empty-parameter removal and preservation of unknown filters.

The implementation uses `URLSearchParams`, retains unrelated parameters, removes empty search parameters and clears a previous source fragment on a new submitted search. Unknown filter values are retained so the UI can explain them rather than silently substituting an unrelated scope. The browser restores state through `popstate`. Those tests passed in the subsequent full run.

## 5. Relevance evaluation and honest denominators

The fixture set contains **26 labelled queries: 18 positive, four absent-vocabulary negatives and four unsupported questions with lexical overlap**. Relevant labels point to exact section references. A paraphrase, “download readings”, deliberately stays in the set because the corpus documents CSV export without using those words. It exposes the absence of synonym retrieval rather than being removed to improve the reported score.

Four evaluation tests were written before the metrics implementation. `node --test tests/evaluation.test.mjs` produced **1 passed, 3 failed** against a stub. The passing test checked actual fixture references; the failed tests required misses to remain in positive denominators, unsupported lexical overlap to count as a negative false positive, and inconsistent labels to be rejected.

The evaluator now validates label IDs and source references and emits every returned reference. `node scripts/evaluate.mjs` measured **MRR 0.9444444444444444, recall@5 0.9444444444444444 and hit@5 0.9444444444444444**. Query p17 is a complete miss. Negative behavior is separate: **4/8 empty result sets and 4/8 lexical false positives**, both rates 0.5. Negative queries do not contribute to MRR, recall or hit metrics. Reports contain hashes and no timestamp so repeated runs can be checked byte-for-byte.

## 6. CLI subprocess verification

Four real-subprocess CLI tests were written before the CLI implementation. They required attributable JSON, filter behavior and error exit codes, boundary/argument rejection and deterministic output. `node --test tests/cli.test.mjs` produced **2 passed, 2 failed** against a stub that always exited 2. Missing success output caused the two expected failures. The stub's empty deterministic output and error status caused the other two tests to pass, so the next run checked them with real successful CLI output.

The CLI imports the same core and corpus as the browser. Valid search exits 0, including zero results. Invalid query, filter, limit or option exits 2. It accepts one quoted query followed by documented flags and rejects repeated flags. No external schema compatibility or remote search capability is claimed.

The subsequent full command `node --test` produced **24 passed, 0 failed** across core, state, evaluation and CLI tests.

## 7. Browser implementation and verification

The UI uses a navy navigation rail, warm neutral background and teal search controls. A responsive form exposes query, manual and category. Suggested topics explicitly reset filters. Results show document/category, section title, excerpt, stable reference, revision and matched-term fraction. Native disclosure elements hold the full source text. Query and source highlighting only create text nodes and `mark` elements; no source strings enter an HTML parser.

A loopback HTTP server was started with `node scripts/serve.mjs`. The browser command was `node scripts/browser-qa.cjs`, with `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` and `BASE_URL` selecting the available browser installation and demo address. This command is reusable on a staged or published demo without source-code changes.

The first browser run passed **16 checks**: initial state; keyboard submission and exact attribution; desktop screenshot; reload; no matches; back/forward; filters; unknown manual/category URL recovery; overlong URL query recovery; hostile source/query rendering; source fragment reload; empty/stopword clearing; suggested-topic filter reset; 360/390/768/1440 layouts; invalid corpus recovery; and absence of page errors, dialogs and external requests.

Both screenshots were inspected. The first mobile full-page capture included an off-screen fixed skip link at the prior scrolled position, even though the element was hidden in the viewport. The capture procedure was changed to blur focus and scroll to the top before desktop/mobile screenshots, and to assert that the skip-link bounding box remains above the viewport. The rerun passed all **16 checks** and produced clean screenshots. This change corrected evidence capture, not ranking behavior.

The browser was desktop Chromium 154.0.8037.98 with viewport emulation. Native mobile devices were not tested. The browser report and screenshot files record the measured local run. Deployment checks belong to the host release process.

A final source-reference audit identified a delimiter collision: `a--b#c` and `a#b--c` would produce the same DOM ID if both parts were joined with `--`. A seventeenth browser check supplied this valid two-manual corpus and failed against the original renderer with one distinct fragment ID instead of two. The separator was changed to a dot, which cannot occur in validated IDs. The complete browser suite was rerun and passed **17 checks**, preserving both canonical source references and distinct fragment targets.

## 8. Reproduction and final verification

Portable commands:

```sh
node --test tests/*.test.mjs
node scripts/search.mjs "battery replacement" --json
node scripts/evaluate.mjs
node scripts/serve.mjs
node scripts/browser-qa.cjs
node scripts/verify.mjs
```

`scripts/verify.mjs` runs all test files, executes evaluation twice and checks identical JSON output, then records the test counts, corpus/query hashes, browser evidence and limits in `evidence/verification.json`. It uses the actual reports rather than guessed metrics or unexecuted assertions. The checked browser screenshots are `evidence/screenshots/manual-search-desktop.png` and `evidence/screenshots/manual-search-mobile.png`.

The first final verification run caught a newly added boundary-test fixture error: 65 base-36 terms included the stopword “a”, leaving 64 indexed terms, so expecting rejection was incorrect. The run reported **23 passed, 1 failed**. Token inspection confirmed the original count and a prefixed fixture with 65 unique terms in 223 characters. The fixture now uses a non-stopword prefix and checks both the accepted 64-term boundary and rejected 65-term input. The ranking implementation was unchanged. The subsequent verification reran the complete suite and evaluated the same dataset twice.

## 9. Practical limits and future work

The labelled data and judgments are synthetic and project-authored, so the measured metrics are evidence of this small demonstration rather than an independent benchmark. Lexical overlap cannot determine whether a source answers warranty, encryption, load-rating or pricing questions. Those four false matches remain visible in the report. The browser shows source paragraphs and cautions readers to verify relevance.

There is no stemming, synonym expansion, spelling correction, semantic retrieval, generated answer, native application, remote service or offline cache. Further work should first add independently reviewed relevance labels from a permitted real corpus, then measure retrieval and performance at scale before changing ranking features. A synonym extension would need tests that distinguish useful paraphrases from unsupported-question false matches.
