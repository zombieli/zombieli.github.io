import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildIndex, search, tokenize } from '../src/lib/manual-core.mjs'
import { evaluate } from '../src/lib/manual-metrics.mjs'
import { readState } from '../src/lib/manual-state.mjs'
import { sourceFragments, sourceFragment, demoSourceUrl } from '../src/lib/manual-journey.ts'
const text = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n')
const json = (path: string) => JSON.parse(text(path))
const corpus = json('../src/data/manual-corpus.json'), labels = json('../src/data/manual-queries.json'), saved = json('../src/data/manual-evaluation.json')
const index = buildIndex(corpus)

test('core, state, corpus and recorded evaluation match the original standalone evidence', () => {
  assert.equal(text('../src/lib/manual-core.mjs'), text('../public/demos/technical-manual-search/core.mjs'))
  assert.equal(text('../src/lib/manual-state.mjs'), text('../public/demos/technical-manual-search/state.mjs'))
  assert.deepEqual(corpus, json('../public/demos/technical-manual-search/data/manuals.json'))
  assert.deepEqual(saved, json('../public/evidence/technical-manual-search-evaluation.json'))
  const report = evaluate(index, labels)
  for (const key of Object.keys(report)) assert.deepEqual(report[key as keyof typeof report], saved[key])
})
test('the paraphrase miss and all four unsupported lexical matches remain in their own denominators', () => {
  const report = evaluate(index, labels)
  assert.equal(report.positive.count, 18)
  assert.equal(report.positive.mrr, 17 / 18)
  assert.deepEqual(report.positive.missesAtK, ['p17'])
  assert.deepEqual(search(index, 'download readings').map(item => item.reference), ['cedar-logger#missing-samples'])
  assert.equal(report.rows.find(row => row.id === 'p17')?.firstRelevantRank, null)
  assert.equal(report.negative.count, 8)
  assert.equal(report.negative.falsePositiveRate, 0.5)
  assert.deepEqual(report.rows.filter(row => row.falsePositive).map(row => row.id), ['n05', 'n06', 'n07', 'n08'])
})
test('normalisation and repeated words do not change ranking while filtered scores retain global statistics', () => {
  assert.deepEqual([...new Set(tokenize('The ＢＡＴＴＥＲＹ / battery replacement'))].sort(), ['battery', 'replacement'])
  assert.deepEqual(search(index, 'battery replacement'), search(index, 'The ＢＡＴＴＥＲＹ / battery replacement'))
  const global = search(index, 'cable', { limit: 50 })
  const scoped = search(index, 'cable', { manual: 'mariner-cart', limit: 50 })
  assert(scoped.length > 0)
  for (const result of scoped) assert.equal(result.score, global.find(item => item.reference === result.reference)?.score)
  assert.deepEqual(search(index, 'cable', { manual: 'mariner-cart', category: 'Data handling' }), [])
})
test('exact sources and matched-term fractions stay separate from relevance labels', () => {
  const result = search(index, 'encrypted CSV export')[0]
  assert.equal(result.reference, 'cedar-logger#csv-export')
  assert.deepEqual(result.matchedTerms, ['csv', 'export'])
  assert.equal(result.queryTermCount, 3)
  assert.equal(result.sourceText, corpus[1].sections[2].text)
  assert.equal(saved.rows.find((row: { id: string }) => row.id === 'n06').falsePositive, true)
})
test('highlight fragments preserve literal markup, whitespace and full-width source spelling', () => {
  const literal = 'A <img src=x onerror=alert(1)> label. ＣＳＶ\n  export.'
  const parts = sourceFragments(literal, ['img', 'csv'])
  assert.equal(parts.map(item => item.text).join(''), literal)
  assert.deepEqual(parts.filter(item => item.matched).map(item => item.text), ['img', 'ＣＳＶ'])
})
test('source links round-trip query/filter state and avoid the original consecutive-hyphen collision', () => {
  assert.notEqual(sourceFragment('a--b', 'c'), sourceFragment('a', 'b--c'))
  const state = { query: 'CSV & export', manual: 'cedar-logger', category: 'Data handling' }
  const link = demoSourceUrl({ manualId: 'cedar-logger', sectionId: 'csv-export' }, state)
  assert(link.startsWith('/demos/technical-manual-search/?'))
  assert.deepEqual(readState('https://portfolio.invalid' + link), state)
  assert.equal(new URL(link, 'https://portfolio.invalid').hash, '#source-cedar-logger.csv-export')
})
