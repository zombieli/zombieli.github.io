# Technical Manual Search

A dependency-free lexical search demonstration for technical reference material. Three original, explicitly fictional training manuals contain fifteen stable sections. Results include a readable excerpt, matched words and complete source text. The browser and command-line search use the same pure ranking core. No generated answers or external service are involved.

## Run

Use Node.js 24 or later. No install or build step is needed for the core, CLI, evaluation or local server.

```sh
node --test tests/*.test.mjs
node scripts/search.mjs "battery replacement"
node scripts/search.mjs "CSV" --manual cedar-logger --json
node scripts/evaluate.mjs
node scripts/serve.mjs
```

Open `http://127.0.0.1:4177/demos/technical-manual-search/`. `PORT` changes the local server port. The entire `web/` directory can be copied to a static host at `/demos/technical-manual-search/`; its assets use relative URLs. Use an HTTP server rather than opening the HTML as a local file, because the corpus is fetched as JSON.

The npm aliases are `npm test`, `npm run search -- "query"`, `npm run evaluate`, `npm run serve` and `npm run test:browser`.

## Browser verification

The reusable browser runner requires Playwright as a development-only test tool. Set `PLAYWRIGHT_MODULE` to an installed Playwright module location or make Playwright resolvable by Node. `CHROMIUM_PATH` selects an installed Chromium browser; if omitted, Playwright uses its configured browser. `BASE_URL` is the **complete demo directory URL**, including its trailing slash, so the same checks can run on a staging or public host.

```sh
BASE_URL=http://127.0.0.1:4177/demos/technical-manual-search/ node scripts/browser-qa.cjs
node scripts/verify.mjs
```

For PowerShell, set environment variables with `$env:BASE_URL='http://127.0.0.1:4177/demos/technical-manual-search/'` before running the command. `scripts/verify.mjs` reruns the unit/CLI suite and evaluation twice, verifies identical evaluation output, and combines these results with the previously captured browser report. It requires a successful browser report to exist. Browser tools are not runtime dependencies and are not included in the source distribution.

## Search contract

- Query limit: 240 UTF-16 code units and 64 distinct non-stopword terms. Oversized queries are rejected rather than truncated.
- Unicode NFKC normalization, lowercase letters and numbers, punctuation boundaries, a small documented stopword set. There is no stemming or synonym expansion.
- BM25-style term-frequency ranking with section headings counted twice. Document-frequency statistics stay global when filters change. Equal scores use a stable `manual-id#section-id` order.
- Matching is OR across distinct query terms. A partial lexical match is possible. The UI shows the matched-term fraction and instructs the reader to inspect the source.
- Manual and category filters intersect. Unknown filters show a recoverable error. Query, manual and category are retained in the URL; browser back/forward restores them.
- Source references are stable within a corpus revision, such as `aurora-beacon#battery-replacement`. Reference links open the complete section and survive reload as a URL fragment.

The CLI accepts `--manual ID`, `--category NAME`, `--limit 1..50` and `--json`. `--help` prints usage. Exit **0** means a valid search, including no matches; exit **2** means invalid arguments, schema or input. JSON output carries exact `sourceText`, source IDs, revision, category, matched terms and ranking score. Scores are ordering values, not answer-confidence probabilities.

## Evidence

The recorded suite passes **24 unit/CLI tests** and **17 browser checks**. See [verification.json](evidence/verification.json), [browser-report.json](evidence/browser-report.json) and the [development log](docs/development-log.md).

The labelled set has 26 queries: 18 positive and 8 negative or unanswerable. Measured MRR, recall@5 and hit@5 are all **0.944444**. One paraphrase misses. Four of the eight negative queries produce lexical false positives. [Evaluation report](evidence/evaluation.md) and [per-query JSON](evidence/evaluation.json) preserve those misses and unsupported matches.

These are project-authored fictional data and relevance judgements, not an independent retrieval benchmark. Checks use desktop Chromium with emulated widths of 360, 390, 768 and 1440 pixels; they do not establish native-phone support or real-equipment suitability. The browser requires initial access to the static files and does not implement an offline cache. The ranking cannot reliably decide whether overlapping words answer an unsupported question.

## Layout

| Directory | Purpose |
| --- | --- |
| `web/` | Complete static demonstration, shared search core and corpus |
| `scripts/` | CLI, local HTTP server, metrics, evaluation and verification |
| `fixtures/` | Labelled positive, negative and unanswerable queries |
| `tests/` | Node test runner cases including real CLI subprocesses |
| `docs/` | Architecture and detailed development record |
| `evidence/` | Measured reports and browser screenshots |

Read [architecture.md](docs/architecture.md) for schema and scoring details.
