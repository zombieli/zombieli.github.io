<script setup lang="ts">
import { computed } from 'vue'
import baseline from '../data/delta-baseline.json'
import candidate from '../data/delta-candidate.json'
import { compareReports } from '../lib/delta-core.mjs'
import { useDeltaPlayback } from '../lib/delta-motion'
import './delta-interactions.css'
const result = compareReports(baseline, candidate)
const { index, playing, reduced, pulse, version, select, stop, replay } = useDeltaPlayback(() => result.rows.length, 1)
const row = computed(() => result.rows[index.value]!)
const label = (kind: string) => kind.replaceAll('-', ' ')
const explanation = computed(() => ({
  'persistent-failure': 'The same identity failed in both reports. It still counts as a candidate failure even though it is not a new regression.',
  regression: 'This identity passed in the baseline and failed in the candidate. It is a regression and contributes to candidate failures.',
  recovery: 'The baseline failure now passes. This recovery does not cancel failures in other candidate cases.',
  removed: 'The baseline identity has no candidate match. Keep the missing case visible as a coverage gap.',
  added: 'The candidate identity has no baseline match. It is added; its candidate status still matters to failure and skip counts.',
  'new-skipped': 'A previously executed case is now skipped. It creates a new coverage gap, with no comparable timing.',
  unchanged: row.value.timing === 'slower' ? 'Both runs passed, so timings can be compared. The increase exceeds both strict limits; it is advisory and does not change the status classification.' : 'Both reports contain this identity with the same status. Only passed-to-passed rows are eligible for timing comparison.',
  resumed: 'A previously skipped case now passes, so it is classified as resumed.',
}[row.value.kind]))
</script>

<template>
  <div class="delta-demo" data-testid="delta-comparison" :data-playing="playing">
    <div class="delta-demo-heading"><p>Interactive comparison · original bundled sample</p><h3>Seven tests on each side. Eight identities.</h3></div>
    <div class="delta-count-strip"><span><strong>7</strong> baseline</span><span><strong>7</strong> candidate</span><span><strong>8</strong> matched or unmatched pairs</span></div>
    <div class="delta-matches" role="group" aria-label="Inspect sample identities"><button v-for="(item, position) in result.rows" :key="JSON.stringify([item.suite, item.name])" type="button" :data-case="position" :aria-pressed="position === index" @click="select(position)"><span>{{ item.suite }}</span><strong>{{ item.name }}</strong><small>{{ label(item.kind) }}{{ item.timing === 'slower' ? ' · slower' : '' }}</small></button></div>
    <div class="delta-pair" :class="{ 'is-tracing': pulse }" :key="version">
      <div class="delta-report-side"><span>Baseline</span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 4h19l9 9v31H10z M29 4v10h9 M17 22h14 M17 29h14 M17 36h9" /></svg><strong data-testid="delta-before">{{ row.baseline?.status ?? 'absent' }}</strong><span>{{ row.baseline ? `${row.baseline.durationMs} ms` : 'No matching identity' }}</span></div>
      <div class="delta-match-center"><svg viewBox="0 0 110 54" aria-hidden="true"><path class="delta-trace" d="M0 27h30 M80 27h30" /><rect x="30" y="4" width="50" height="46" rx="4" /><path d="M39 18h12v18H39z M59 18h12v18H59z M51 27h8" /></svg><strong>Exact pair</strong><span>One comparison core</span></div>
      <div class="delta-report-side"><span>Candidate</span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 4h19l9 9v31H10z M29 4v10h9 M17 22h14 M17 29h14 M17 36h9" /></svg><strong data-testid="delta-after">{{ row.candidate?.status ?? 'absent' }}</strong><span>{{ row.candidate ? `${row.candidate.durationMs} ms` : 'No matching identity' }}</span></div>
    </div>
    <div class="delta-explanation" :aria-live="playing ? 'off' : 'polite'"><span class="delta-kicker">{{ row.suite }} / {{ row.name }}</span><h4 data-testid="delta-kind">{{ label(row.kind) }}</h4><p>{{ explanation }}</p><div class="delta-row-facts"><span>Timing <strong data-testid="delta-timing">{{ row.timing }}</strong></span><span>Delta <strong>{{ row.deltaMs === null ? 'Not compared' : `${row.deltaMs > 0 ? '+' : ''}${row.deltaMs} ms` }}</strong></span><span>Candidate failure <strong>{{ row.candidate?.status === 'failed' ? 'Yes' : 'No' }}</strong></span></div></div>
    <div class="delta-controls"><button type="button" @click="playing ? stop() : replay()">{{ playing ? 'Pause matching' : 'Replay matching' }}</button><button type="button" :disabled="index === 0" @click="select(index - 1)">Previous pair</button><button type="button" :disabled="index === result.rows.length - 1" @click="select(index + 1)">Next pair</button><span>{{ index + 1 }} / {{ result.rows.length }}</span></div>
    <p class="delta-demo-note">{{ reduced ? 'Reduced motion: use the case buttons or pair controls. ' : 'The moving trace explains matching; playback speed is illustrative. ' }}Results are computed by the original pure core from the exact bundled sample. Counts are overlapping facets, not categories to add together.</p>
  </div>
</template>
