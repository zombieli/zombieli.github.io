# Architecture

## Data flow and boundaries

`web/data/manuals.json → validateCorpus → buildIndex → search → result cards`

The CLI imports `web/core.mjs`, reads the same JSON and renders the same results as text or JSON. `scripts/metrics.mjs` uses the core without a browser to compare returned source references with labelled relevance judgements. Browser URL state is isolated in `web/state.mjs`. `web/app.mjs` owns DOM rendering and browser navigation only. There are no third-party runtime dependencies, build transformations or remote endpoints.

The browser fetches a relative corpus URL. Loading or schema failure disables search and displays the error. Search failures clear previous results immediately while preserving the query for correction. No data is written to storage; only query/filter state enters browser history.

## Corpus schema

The root is an array of 1–100 manuals with at most 2,000 total sections. Each manual has `id`, `title`, `category`, `revision` and an array of 1–100 `sections`. Each section has `id`, `title` and `text`. IDs use `[a-z][a-z0-9-]*`, with a maximum length of 64. Manual IDs are globally unique; section IDs are unique within each manual. A section's canonical reference is `manual.id + '#' + section.id`.

Titles are non-empty text up to 160 characters, categories up to 80, revisions up to 40, and section text up to 20,000. Invalid or duplicate IDs fail indexing. Original text is retained exactly rather than normalized for display. A new index copies source fields and hides frequency maps in a module-private WeakMap, so result-object mutation cannot change future search results. Public index metadata and reference arrays are frozen.

Example:

```json
{
  "id": "aurora-beacon",
  "title": "Aurora B7 Training Beacon",
  "category": "Field equipment",
  "revision": "1.0",
  "sections": [
    { "id": "power-isolation", "title": "Isolate power", "text": "Fictional training paragraph." }
  ]
}
```

The provided manuals explicitly describe fictional classroom equipment. They are not vendor documentation. Stable IDs are meant to survive title edits; changing paragraph contents should be paired with a revision update and new evaluation evidence.

## Tokenization and ranking

Text is normalized to Unicode NFKC, lowercased and split into maximal letter-or-number sequences. Punctuation, slashes, hyphens and underscores create boundaries. Stopwords are:

`a an and are as at be before by for from in is it of on or that the this to with your`

Every indexed section combines the manual title once, section heading twice and complete section text once. Heading repetition is an explicit term-frequency boost; it also contributes to section length. Repeated query tokens are deduplicated and sorted, ensuring query repetition cannot manipulate ranking or floating-point accumulation order. There is no prefix match, phrase syntax, spelling correction, stemming, synonym mapping or semantic model.

For each distinct query term present in a section, the score adds:

```text
idf = log(1 + (N - df + 0.5) / (df + 0.5))
score += idf * tf * (k1 + 1)
         / (tf + k1 * (1 - b + b * sectionLength / averageLength))
k1 = 1.2; b = 0.75
```

`N` is the count of indexed sections, `df` is the section frequency for the term and `tf` its frequency in the combined section text. IDF and length normalization use the whole corpus, even under filters, so filter selection does not silently change relevance statistics. All matching terms contribute; zero-match sections are excluded. The implementation has no tuned minimum-score threshold. Scores order results and do not establish that a section answers the question.

The corpus is internally sorted by reference. Results sort by descending unrounded score and then ascending reference using code-point comparison, avoiding locale-dependent ties. Result limits are integer values from 1–50. Query bounds are 240 UTF-16 code units and 64 distinct terms; invalid queries throw explicit errors. Empty or stopword-only queries return no results.

## Source display and URL state

Excerpts are up to 220 characters plus boundary ellipses, centred near the earliest matching term where possible. Exact full text remains available in a native `details` element. The excerpt is a navigation aid, not a rewritten summary. Heading-only matches may have an unhighlighted excerpt; matched-term counts cover the entire indexed section representation.

Highlighting scans source text for lexical tokens and creates `mark` elements containing `textContent`. Unmatched spans use text nodes. Query, title, category and source content never pass through `innerHTML`. A literal label such as `<img src=x onerror=alert(1)>` remains literal source text.

URL parameters are `q`, `manual` and `category`. Unrelated parameters are preserved. Submission uses `history.pushState`; `popstate` restores controls and results. Unknown manual/category values are preserved as visible temporary options so a reader can see and correct malformed URLs. The source fragment uses `source-{manualId}.{sectionId}`. A dot cannot appear in either validated ID, so the separator cannot collide with IDs containing consecutive hyphens. Reference links open their source details; reload restores that open source.

## Evaluation semantics

The labelled set contains 18 positive and eight negative/unanswerable queries. Positive labels specify exact relevant section references; negative labels must have none. IDs must be unique, references known, and labels consistent. Results are evaluated at `k=5` and rank depth 50, which exceeds the 15-section corpus.

- MRR: mean reciprocal rank of the first relevant section, with zero for every miss.
- Recall@5: mean fraction of each query's relevant labels retrieved among the first five results.
- Hit@5: fraction of positive queries with at least one relevant result among the first five.
- Negative empty-result rate and false-positive rate: reported separately; any result for a negative label counts as a lexical false positive.

Negative queries never add to positive retrieval metrics. Evaluation JSON contains every returned reference and per-query metric, corpus hash and query-set hash. Repeating the command produces byte-identical JSON because no run timestamp is inserted. The paraphrase miss and four unsupported-query false positives remain visible. The data is small, synthetic and authored alongside the search requirements; these scores establish reproducibility, not performance on real manuals.

## Verification and limits

The Node suite checks schema, tokenizer, query bounds, stable ties, order independence, filters, source fidelity, CLI exit behavior, metrics denominators and URL encoding. Browser checks cover literal hostile input, full source text, navigation, malformed URL recovery, unavailable data, keyboard submission and four responsive widths. The local server binds only to loopback and is a development utility, not a production hosting service.

There is no answer generator, external account, native app, equipment connection, indexing service, multi-user backend, installed offline cache or untested performance claim. A larger real corpus would require independent relevance labels, scale measurements and a deliberate decision about synonyms and unsupported-question handling.
