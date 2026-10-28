<script setup lang="ts">
import { computed, ref } from 'vue'
import corpus from '../data/manual-corpus.json'
import { buildIndex, search, tokenize } from '../lib/manual-core.mjs'
import { demoSourceUrl } from '../lib/manual-journey'
import { useManualPlayback } from '../lib/manual-motion'
import ManualMarkedText from './ManualMarkedText.vue'
import './manual-interactions.css'
const searchIndex = buildIndex(corpus)
const query = ref('battery replacement'), manual = ref(''), category = ref('')
const submitted = ref({ query: query.value, manual: '', category: '' })
const selectedRef = ref('')
const { index: step, playing, reduced, pulse, version, select, stop, replay, highlight } = useManualPlayback(() => 3, 2)
const found = computed(() => { try { return { rows: search(searchIndex, submitted.value.query, { ...submitted.value, limit: 50 }), error: '' } } catch (error) { return { rows: [], error: error instanceof Error ? error.message : 'Search input is invalid.' } } })
const terms = computed(() => found.value.error ? [] : [...new Set(tokenize(submitted.value.query))].sort())
const selected = computed(() => found.value.rows.find(row => row.reference === selectedRef.value) ?? found.value.rows[0])
const eligible = computed(() => corpus.filter(item => (!submitted.value.manual || item.id === submitted.value.manual) && (!submitted.value.category || item.category === submitted.value.category)).reduce((sum, item) => sum + item.sections.length, 0))
const steps = [
  { label: 'Query terms', icon: 'M5 7h38v31H5z M12 16h24 M12 23h16 M12 30h10', detail: 'NFKC normalisation and lowercase make width and case consistent. Punctuation splits words; stopwords are removed. Query terms are deduplicated and sorted, so repetition cannot increase a score.' },
  { label: 'Global index', icon: 'M8 10c0-9 32-9 32 0s-32 9-32 0v28c0 9 32 9 32 0V10 M8 23c0 9 32 9 32 0', detail: 'Every section indexes the manual title once, its heading twice and its full text once. The 15-section document-frequency and length statistics stay global when filters narrow eligible results.' },
  { label: 'Ranked sections', icon: 'M6 8h35v7H6z M6 22h25v7H6z M6 36h15v7H6z', detail: 'Any distinct query term can match. BM25-style scores sort sections, followed by a stable reference tie-break. A score ranks word overlap; it is not an answer-confidence probability.' },
]
const suggestions = [{ label: 'Exact task', query: 'battery replacement' }, { label: 'Repeated / full-width', query: 'The ＢＡＴＴＥＲＹ / battery replacement' }, { label: 'Paraphrase miss', query: 'download readings' }, { label: 'Unsupported question', query: 'encrypted CSV export' }]
function run() { submitted.value = { query: query.value, manual: manual.value, category: category.value }; selectedRef.value = ''; select(0) }
function suggest(value: string) { query.value = value; manual.value = ''; category.value = ''; run() }
function inspect(reference: string) { selectedRef.value = reference; select(2); highlight() }
</script>

<template>
  <div class="manual-demo" data-testid="manual-ranking" :data-playing="playing">
    <div class="manual-demo-heading"><p>Interactive retrieval · original corpus and core</p><h3>Follow the words into the index.</h3></div>
    <form class="manual-query-form" @submit.prevent="run"><label class="manual-query-label">Query<input v-model="query" type="text" autocomplete="off" spellcheck="false"></label><div class="manual-field"><label for="manual-playground-manual">Manual filter</label><select id="manual-playground-manual" v-model="manual"><option value="">All manuals</option><option v-for="item in searchIndex.manuals" :key="item.id" :value="item.id">{{ item.title }}</option></select></div><div class="manual-field"><label for="manual-playground-category">Category filter</label><select id="manual-playground-category" v-model="category"><option value="">All categories</option><option v-for="item in searchIndex.categories" :key="item" :value="item">{{ item }}</option></select></div><button type="submit" class="manual-primary">Run search</button></form>
    <div class="manual-options" role="group" aria-label="Query examples"><button v-for="item in suggestions" :key="item.label" type="button" @click="suggest(item.query)">{{ item.label }}</button></div>
    <div class="manual-flow" :class="{ 'is-tracing': pulse }"><button v-for="(item, position) in steps" :key="item.label" type="button" :data-ranking-step="position" :aria-pressed="step === position" @click="select(position)"><svg :key="version" viewBox="0 0 48 48" aria-hidden="true"><path :d="item.icon" /></svg><strong>{{ item.label }}</strong><span>{{ position === 0 ? `${terms.length} distinct term${terms.length === 1 ? '' : 's'}` : position === 1 ? `${searchIndex.sectionCount} sections indexed` : `${found.rows.length} lexical match${found.rows.length === 1 ? '' : 'es'}` }}</span></button></div>
    <div class="manual-explanation" :aria-live="playing ? 'off' : 'polite'"><h4>{{ steps[step].label }}</h4><p>{{ steps[step].detail }}</p><div v-if="step === 0" class="manual-token-list" data-testid="manual-tokens"><span v-for="term in terms" :key="term">{{ term }}</span><em v-if="!terms.length">{{ found.error ? 'Input rejected' : 'No searchable terms' }}</em></div><div v-else-if="step === 1" class="manual-inline-facts"><span><strong>15</strong> global sections</span><span><strong data-testid="manual-eligible">{{ eligible }}</strong> eligible after filters</span><span>k₁ = 1.2 · b = 0.75</span></div><p v-else class="manual-small">The bars below use scores from the real core. Click a section to inspect its attribution.</p></div>
    <p v-if="found.error" class="manual-error" role="status" data-testid="manual-search-error">{{ found.error }} Previous results have been cleared.</p>
    <div v-else-if="found.rows.length" class="manual-ranking-list" role="group" aria-label="Ranked source sections"><button v-for="(row, position) in found.rows" :key="row.reference" type="button" :data-result-ref="row.reference" :data-score="row.score" :aria-pressed="selected?.reference === row.reference" @click="inspect(row.reference)"><span class="manual-rank-number">{{ String(position + 1).padStart(2, '0') }}</span><span class="manual-rank-content"><strong>{{ row.sectionTitle }}</strong><span>{{ row.manualTitle }}</span><i class="manual-score-track" aria-hidden="true"><i :style="{ width: `${row.score / found.rows[0].score * 100}%` }" /></i></span><span class="manual-rank-score">{{ row.score.toFixed(3) }}<small>{{ row.matchedTerms.length }}/{{ row.queryTermCount }} terms</small></span></button></div>
    <p v-else class="manual-empty" role="status" data-testid="manual-no-results">No lexical matches. Broaden the filters or try words present in the corpus.</p>
    <div v-if="selected" class="manual-selected-source" data-testid="manual-ranked-source"><div class="manual-source-meta"><strong>{{ selected.reference }}</strong><span>Revision {{ selected.revision }}</span></div><p><ManualMarkedText :text="selected.excerpt" :terms="selected.matchedTerms" /></p><details :key="selected.reference"><summary>Read the exact source paragraph</summary><p data-testid="manual-ranking-full-source"><ManualMarkedText :text="selected.sourceText" :terms="selected.matchedTerms" /></p></details><a class="text-link" :href="demoSourceUrl(selected, submitted)">Open this source in the standalone demo</a></div>
    <div class="manual-controls"><button type="button" @click="playing ? stop() : replay()">{{ playing ? 'Pause retrieval' : 'Replay retrieval' }}</button><span>{{ reduced ? 'Reduced motion: select any stage manually.' : 'Click a stage or replay the three boundaries.' }}</span></div><p class="manual-demo-note">The original pure core searches all 15 fictional sections locally. Animation speed is illustrative. Filters apply when you run the search; examples reset both filters.</p>
  </div>
</template>
