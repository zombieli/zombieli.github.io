<script setup lang="ts">
import { computed, ref } from 'vue'
import results from '../data/scheduling-results.json'
import './scheduling-comparison.css'

type Metric = 'mean_wait_min' | 'max_wait_min'
const scenario = ref('steady-short-arrivals')
const metric = ref<Metric>('mean_wait_min')
const names = [...new Set(results.rows.map(row => row.scenario))]
const rows = computed(() => results.rows.filter(row => row.scenario === scenario.value))
const maximum = computed(() => Math.max(1, ...rows.value.map(row => row[metric.value])))
const worseLongest = computed(() => metric.value === 'max_wait_min' && rows.value[1]![metric.value] > rows.value[0]![metric.value])
const label = (name: string) => name === 'steady-short-arrivals' ? 'Steady short arrivals' : name === 'sparse-arrivals' ? 'Sparse arrivals' : 'Mixed arrivals · seed ' + Number(name.slice(-2))
</script>

<template>
  <div class="scheduling-comparison" data-testid="scheduling-comparison">
    <div class="comparison-heading"><p class="eyebrow">The recorded comparison</p><h3>Change the question. Keep the same data.</h3><p>Select a scenario and compare the two waiting-time measures.</p></div>
    <label for="comparison-scenario">Compare recorded scenario</label>
    <select id="comparison-scenario" v-model="scenario"><option v-for="name in names" :key="name" :value="name">{{ label(name) }}</option></select>
    <div class="comparison-controls" role="group" aria-label="Waiting-time metric"><button type="button" :aria-pressed="metric === 'mean_wait_min'" aria-controls="comparison-bars" @click="metric = 'mean_wait_min'">Average wait</button><button type="button" :aria-pressed="metric === 'max_wait_min'" aria-controls="comparison-bars" @click="metric = 'max_wait_min'">Longest wait</button></div>
    <div id="comparison-bars" class="comparison-bars" aria-live="polite" aria-atomic="true">
      <p class="comparison-axis">{{ metric === 'mean_wait_min' ? 'Average' : 'Longest' }} waiting time · minutes · lower is less waiting</p>
      <div v-for="row in rows" :key="row.policy" class="comparison-row" :class="{ 'is-spt': row.policy === 'spt', 'is-tradeoff': row.policy === 'spt' && worseLongest }">
        <div class="comparison-bar-label"><strong>{{ row.policy.toUpperCase() }}</strong><span><b :data-metric-policy="row.policy">{{ row[metric].toFixed(2) }}</b> min</span></div>
        <div class="comparison-track" aria-hidden="true"><span :style="{ width: (row[metric] / maximum * 100) + '%' }" /></div>
      </div>
      <p class="comparison-scale">Bars share a scale within this comparison. Exact recorded values are shown above.</p>
    </div>
    <div class="comparison-reading" aria-live="polite">
      <template v-if="scenario === 'steady-short-arrivals'"><strong>{{ metric === 'mean_wait_min' ? 'The average improves. The long job still waits.' : 'The longest wait rises from 27 to 93 minutes.' }}</strong><p>SPT serves the 31 short jobs before the long job. Switch between the two measures to see what an average alone leaves out. Both policies finish at minute 118.</p></template>
      <template v-else-if="scenario === 'sparse-arrivals'"><strong>Both policies have zero waiting.</strong><p>Each job arrives after the bench is available. Changing the selection rule has no effect on these 12 jobs; both finish at minute 450.</p></template>
      <template v-else><strong>Same jobs and constraints, different selection rules.</strong><p>This fixed-seed scenario contains {{ rows[0]!.job_count }} synthetic jobs. Compare both measures before interpreting the result; a lower average does not guarantee a lower longest wait.</p></template>
    </div>
    <p class="comparison-note">Saved experiment data · 9 October 2026 (UTC+8). Selecting a measure changes the chart, not the experiment. These observations do not establish real operational savings.</p>
  </div>
</template>
