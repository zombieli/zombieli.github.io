<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DiagnosticAttempt, DiagnosticReport } from '../lib/diagnostics-report'
import RecordedFlow, { type RecordedFlowStep } from './RecordedFlow.vue'
import './diagnostics-decisions.css'

const props = defineProps<{ report: DiagnosticReport | null; loading: boolean; error: string }>()
const emit = defineEmits<{ retry: [] }>()
const selected = ref<'recover_after_disconnect' | 'malformed'>('recover_after_disconnect')
const resetRequest = ref(0)
const result = computed(() => props.report?.cases.find(item => item.scenario === selected.value))

function selectScenario(scenario: typeof selected.value) {
  selected.value = scenario
  resetRequest.value += 1
}

const flowSteps = computed<RecordedFlowStep[]>(() => {
  if (!result.value) return []
  return result.value.attempts.flatMap((attempt, index) => {
    const hasNext = index < result.value!.attempts.length - 1
    const retryable = attempt.diagnostic === 'connection_error' || attempt.diagnostic === 'timeout'
    const policy = explainAttempt(attempt, hasNext)
    return [
      { id: `attempt-${attempt.attempt}`, label: `Attempt ${attempt.attempt}`, value: attempt.diagnostic, detail: attempt.message || (attempt.diagnostic === 'ok' ? 'A valid status response was recorded.' : `The saved diagnostic is ${attempt.diagnostic}.`), kind: 'observation' as const },
      {
        id: `policy-${attempt.attempt}`,
        label: hasNext ? 'Retry policy' : 'End of sequence',
        value: hasNext ? (retryable ? 'Retry connection' : 'Next recorded attempt') : 'Stop',
        detail: hasNext && !retryable ? 'The saved report contains another attempt; the recorded sequence is preserved here.' : policy,
        kind: hasNext ? 'decision' as const : 'outcome' as const,
      },
    ]
  })
})

function explainAttempt(attempt: DiagnosticAttempt, hasNext: boolean) {
  if (attempt.diagnostic === 'connection_error' || attempt.diagnostic === 'timeout') {
    return hasNext
      ? 'Retry allowed: this transport failure can recover on a new connection.'
      : 'Transport failures are eligible for a bounded retry; no further attempt is recorded.'
  }
  if (attempt.diagnostic === 'protocol_error') return 'Stop: a protocol error is not eligible for retry.'
  if (attempt.diagnostic === 'ok') return 'Stop: a valid response was recorded.'
  return 'This diagnostic is preserved exactly as recorded.'
}
</script>

<template>
  <div class="decision-panel" data-testid="retry-decision" aria-labelledby="retry-decision-title">
    <h3 id="retry-decision-title">Retry the connection, or stop?</h3>
    <p>Compare two saved simulator cases. The attempt sequence comes from the report; selecting a case does not run a new test.</p>
    <div class="decision-controls" role="group" aria-label="Choose a recorded fault">
      <button class="button" :class="selected === 'recover_after_disconnect' ? 'primary' : 'secondary'" type="button" :aria-pressed="selected === 'recover_after_disconnect'" aria-controls="retry-decision-result" @click="selectScenario('recover_after_disconnect')">Disconnect and recover</button>
      <button class="button" :class="selected === 'malformed' ? 'primary' : 'secondary'" type="button" :aria-pressed="selected === 'malformed'" aria-controls="retry-decision-result" @click="selectScenario('malformed')">Malformed JSON</button>
    </div>
    <p class="decision-policy" v-if="selected === 'recover_after_disconnect'">Policy: retry transport failures within a fixed attempt limit. A lost connection may recover, so retain the failed attempt as well as the next observation.</p>
    <p class="decision-policy" v-else>Policy: stop on protocol errors. Invalid JSON cannot be validated as a device status, and repeating it would hide the problem.</p>

    <div id="retry-decision-result" class="decision-content" aria-live="polite" :aria-busy="loading">
      <p v-if="loading" class="decision-status">Loading the recorded attempts…</p>
      <div v-else-if="error" class="decision-status">
        <p>The normal report could not be loaded.</p>
        <a href="#demo" @click="emit('retry')">Reload normal evidence in the scenario viewer</a>
      </div>
      <template v-else-if="report">
        <template v-if="result">
          <RecordedFlow id="retry-flow" label="Recorded retry decision path" :context="`${report.run_id}:${selected}`" :steps="flowSteps" :reset-request="resetRequest" />
          <dl class="decision-facts">
            <div><dt>Recorded attempts</dt><dd>{{ result.attempt_count }}</dd></div>
            <div><dt>Final diagnostic</dt><dd><code>{{ result.diagnostic }}</code></dd></div>
            <div><dt>Test outcome</dt><dd class="decision-outcome" :class="{ 'decision-fail': result.outcome === 'fail' }">{{ result.outcome.toUpperCase() }}</dd></div>
          </dl>
          <details class="decision-payload">
            <summary>Inspect {{ result.attempt_count }} recorded {{ result.attempt_count === 1 ? 'attempt' : 'attempts' }}</summary>
            <ol class="decision-sequence" aria-label="Recorded attempt sequence">
              <li v-for="(attempt, index) in result.attempts" :key="attempt.attempt" class="decision-attempt">
                <div class="decision-attempt-heading"><strong>Attempt {{ attempt.attempt }}</strong><code>{{ attempt.diagnostic }}</code><span>{{ attempt.duration_ms }} ms</span></div>
                <p v-if="attempt.message" class="decision-message">{{ attempt.message }}</p>
                <p class="decision-explanation">{{ explainAttempt(attempt, index < result.attempts.length - 1) }}</p>
              </li>
            </ol>
          </details>
        </template>
        <p v-else class="decision-status">This report does not contain the selected scenario, so no attempt sequence is shown. Choose the other case or inspect the saved report.</p>
        <dl class="decision-provenance">
          <div><dt>Run</dt><dd>{{ report.run_id }}</dd></div>
          <div><dt>Captured</dt><dd>{{ report.started_at_utc }}</dd></div>
          <div><dt>Evidence origin</dt><dd>{{ report.evidence_origin }}</dd></div>
          <div><dt>Source SHA-256</dt><dd><code :title="report.source_sha256">{{ report.source_sha256.slice(0, 12) }}</code></dd></div>
        </dl>
        <a class="decision-source" href="/evidence/normal-report.json">Open the saved normal report</a>
      </template>
      <p v-else class="decision-status">No recorded report is available. <a href="#demo" @click="emit('retry')">Load evidence in the scenario viewer</a>.</p>
    </div>
  </div>
</template>
