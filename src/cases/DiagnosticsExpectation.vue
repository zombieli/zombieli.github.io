<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { readDiagnosticsReport } from '../lib/diagnostics-report'
import type { DiagnosticReport } from '../lib/diagnostics-report'
import RecordedFlow, { type RecordedFlowStep } from './RecordedFlow.vue'

const props = defineProps<{ report: DiagnosticReport | null; loading: boolean; error: string }>()
const emit = defineEmits<{ retry: [] }>()
const selected = ref<'expected' | 'unexpected'>('expected')
const resetRequest = ref(0)
const failureReport = ref<DiagnosticReport | null>(null)
const failureLoading = ref(true)
const failureError = ref('')
const selectedReport = computed(() => selected.value === 'expected' ? props.report : failureReport.value)
const selectedLoading = computed(() => selected.value === 'expected' ? props.loading : failureLoading.value)
const selectedError = computed(() => selected.value === 'expected' ? props.error : failureError.value)
const result = computed(() => selectedReport.value?.cases.find(item => item.scenario === 'missing_field'))
const lastAttempt = computed(() => result.value?.attempts[result.value.attempts.length - 1])
const temperatureState = computed(() => {
  const response = lastAttempt.value?.response
  if (!response) return 'No response body captured'
  return Object.prototype.hasOwnProperty.call(response, 'temperature_c') ? 'Present in the saved response' : 'Missing from the saved response'
})
const flowSteps = computed<RecordedFlowStep[]>(() => {
  if (!result.value) return []
  return [
    { id: 'observation', label: 'Observed diagnostic', value: result.value.diagnostic, detail: `temperature_c: ${temperatureState.value.toLowerCase()}. ${lastAttempt.value?.message || ''}`.trim(), kind: 'observation' },
    { id: 'comparison', label: 'Compare expectation', value: result.value.expected, detail: `Compare the observation (${result.value.diagnostic}) with this run's configured expectation (${result.value.expected}).`, kind: 'decision' },
    { id: 'outcome', label: 'Recorded outcome', value: result.value.outcome.toUpperCase(), detail: result.value.outcome === 'pass' ? 'The saved observation met the configured expectation. PASS does not mean the response itself was valid.' : 'The saved observation did not meet the configured expectation. This run records the mismatch as FAIL.', kind: 'outcome', failed: result.value.outcome === 'fail' },
  ]
})

function selectExpectation(expectation: typeof selected.value) {
  selected.value = expectation
  resetRequest.value += 1
}
let active = true
let request: AbortController | undefined

async function loadFailureReport() {
  if (request) return
  failureLoading.value = true
  failureError.value = ''
  const controller = new AbortController()
  request = controller
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('/evidence/failure-report.json', { signal: controller.signal, cache: 'no-cache' })
    const loaded = await readDiagnosticsReport(response)
    if (active) failureReport.value = loaded
  } catch {
    if (active) failureError.value = 'The separate failing run could not be loaded. The expected-fault result and the evidence downloads remain available.'
  } finally {
    window.clearTimeout(timeout)
    request = undefined
    if (active) failureLoading.value = false
  }
}

onMounted(() => { void loadFailureReport() })
onUnmounted(() => {
  active = false
  request?.abort()
})
</script>

<template>
  <div class="decision-panel" data-testid="expectation-decision" aria-labelledby="expectation-decision-title">
    <h3 id="expectation-decision-title">Same fault. Different expectation.</h3>
    <p>Both recorded runs check a response missing <code>temperature_c</code>. Compare the saved expectations and outcomes to see why a detected fault can pass a test.</p>
    <div class="decision-controls" role="group" aria-label="Choose a recorded expectation">
      <button class="button" :class="selected === 'expected' ? 'primary' : 'secondary'" type="button" :aria-pressed="selected === 'expected'" aria-controls="expectation-decision-result" @click="selectExpectation('expected')">Expected fault</button>
      <button class="button" :class="selected === 'unexpected' ? 'primary' : 'secondary'" type="button" :aria-pressed="selected === 'unexpected'" aria-controls="expectation-decision-result" @click="selectExpectation('unexpected')">Unexpected fault</button>
    </div>
    <p class="decision-policy">The diagnostic describes what the adapter observed. The test outcome records whether that observation met the configured expectation.</p>

    <div id="expectation-decision-result" class="decision-content" aria-live="polite" :aria-busy="selectedLoading">
      <p v-if="selectedLoading" class="decision-status">Loading the recorded comparison…</p>
      <div v-else-if="selectedError" class="decision-status">
        <template v-if="selected === 'expected'"><p>The normal report could not be loaded.</p><a href="#demo" @click="emit('retry')">Reload normal evidence in the scenario viewer</a></template>
        <template v-else><p>{{ failureError }}</p><button class="button secondary" type="button" @click="loadFailureReport">Retry comparison evidence</button></template>
      </div>
      <template v-else-if="selectedReport">
        <template v-if="result">
          <RecordedFlow id="expectation-flow" label="Recorded expectation comparison path" :context="`${selectedReport.run_id}:${selected}`" :steps="flowSteps" :reset-request="resetRequest" />
          <dl class="decision-facts">
            <div><dt>Expected</dt><dd><code data-field="expected">{{ result.expected }}</code></dd></div>
            <div><dt>Observed diagnostic</dt><dd><code data-field="diagnostic">{{ result.diagnostic }}</code></dd></div>
            <div><dt>Recorded outcome</dt><dd class="decision-outcome" :class="{ 'decision-fail': result.outcome === 'fail' }" data-field="outcome">{{ result.outcome.toUpperCase() }}</dd></div>
          </dl>
          <p class="decision-explanation" v-if="result.outcome === 'pass'">The recorded observation met this run's expectation. PASS does not mean the response itself was valid.</p>
          <p class="decision-explanation" v-else>The recorded observation did not meet this run's expectation. The report preserves that mismatch as FAIL.</p>
          <details v-if="lastAttempt" class="decision-payload"><summary>Inspect the recorded response</summary><div class="decision-observation"><span>Response field: <code>temperature_c</code></span><strong>{{ temperatureState }}</strong><p v-if="lastAttempt.message">{{ lastAttempt.message }}</p></div><pre>{{ JSON.stringify(lastAttempt.response ?? null, null, 2) }}</pre></details>
        </template>
        <p v-else class="decision-status">This report does not contain the missing-field scenario, so no comparison result is shown. The other run and source reports remain available.</p>
        <dl class="decision-provenance">
          <div><dt>Run</dt><dd>{{ selectedReport.run_id }}</dd></div>
          <div><dt>Captured</dt><dd>{{ selectedReport.started_at_utc }}</dd></div>
          <div><dt>Evidence origin</dt><dd>{{ selectedReport.evidence_origin }}</dd></div>
          <div><dt>Source SHA-256</dt><dd><code :title="selectedReport.source_sha256">{{ selectedReport.source_sha256.slice(0, 12) }}</code></dd></div>
        </dl>
        <a class="decision-source" :href="selected === 'expected' ? '/evidence/normal-report.json' : '/evidence/failure-report.json'">Open this saved run</a>
      </template>
      <p v-else class="decision-status">No recorded report is available. <a href="#demo" @click="emit('retry')">Load normal evidence in the scenario viewer</a>.</p>
    </div>
  </div>
</template>
