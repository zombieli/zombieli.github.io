<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import baseline from '../data/delta-baseline.json'
import candidate from '../data/delta-candidate.json'
import { compareReports } from '../lib/delta-core.mjs'
import { policyScenario, type PolicyScenario } from '../lib/delta-journey'
import { useDeltaPlayback } from '../lib/delta-motion'
const scenarios: { id: PolicyScenario; label: string }[] = [{ id: 'sample', label: 'Bundled sample' }, { id: 'coverage', label: 'Coverage gaps' }, { id: 'added-failure', label: 'Added failure' }, { id: 'empty', label: 'Empty candidate' }, { id: 'timing', label: 'Timing only' }]
const scenario = ref<PolicyScenario>('sample')
const allowRemoved = ref(false), allowSkipped = ref(false)
const before = ref<number | string>(100), after = ref<number | string>(450), ratio = ref<number | string>(1.5), milliseconds = ref<number | string>(100)
const { index, pulse, version, reduced, select, highlight } = useDeltaPlayback(() => 3)
const evaluated = computed(() => {
  try {
    if (ratio.value === '' || milliseconds.value === '' || (scenario.value === 'timing' && (before.value === '' || after.value === ''))) throw new Error('Enter all timing values to compare.')
    const pair = policyScenario(scenario.value, baseline, candidate, Number(before.value), Number(after.value))
    return { result: compareReports(pair.baseline, pair.candidate, { allowRemoved: allowRemoved.value, allowSkipped: allowSkipped.value, slowdownRatio: Number(ratio.value), slowdownMs: Number(milliseconds.value) }), error: '' }
  } catch (error) { return { result: null, error: error instanceof Error ? error.message : 'Invalid inputs.' } }
})
const result = computed(() => evaluated.value.result)
const coverageBlocked = computed(() => !!result.value && (!result.value.counts.candidate || (!allowRemoved.value && result.value.counts.removed > 0) || (!allowSkipped.value && result.value.counts.newSkipped > 0)))
const gates = computed(() => [
  { title: 'Candidate failures', detail: 'Every failed candidate blocks acceptance, including an added failure. A recovery elsewhere cannot cancel it.', value: result.value ? `${result.value.counts.candidateFailures} failed` : 'Unavailable', blocked: !!result.value?.counts.candidateFailures, icon: 'M8 5h32v38H8z M16 15l16 16 M32 15L16 31' },
  { title: 'Coverage', detail: 'Removed or newly skipped tests require their own explicit override. An empty candidate is always incomplete. These reasons remain visible even when failures take precedence.', value: result.value ? coverageBlocked.value ? 'Incomplete' : 'Permitted' : 'Unavailable', blocked: coverageBlocked.value, icon: 'M6 8h16v14H6z M26 8h16v14H26z M6 28h16v14H6z M26 28h16v14H26z M30 35h8' },
  { title: 'Comparison verdict', detail: 'Failures take precedence over incomplete coverage. Otherwise the result passes the stated policy. Both fail and incomplete map to CLI exit 1; invalid inputs map to exit 2.', value: result.value?.verdict ?? 'No verdict', blocked: !!result.value && result.value.verdict !== 'pass', icon: 'M4 24h11 M15 10h28v28H15z M22 23l5 6 10-14' },
])
watch([scenario, allowRemoved, allowSkipped, before, after, ratio, milliseconds], () => { select(2) })
function choose(id: PolicyScenario) { scenario.value = id; allowRemoved.value = false; allowSkipped.value = false; before.value = 100; after.value = 450; ratio.value = 1.5; milliseconds.value = 100; highlight() }
function preset(b: number, c: number) { before.value = b; after.value = c; ratio.value = 1.5; milliseconds.value = 100 }
</script>

<template>
  <div class="delta-demo" data-testid="delta-policy">
    <div class="delta-demo-heading"><p>Interactive decision gates</p><h3>What is allowed to change the verdict?</h3></div>
    <div class="delta-options" role="group" aria-label="Comparison scenario"><button v-for="option in scenarios" :key="option.id" type="button" :data-policy-scenario="option.id" :aria-pressed="scenario === option.id" @click="choose(option.id)">{{ option.label }}</button></div>
    <div class="delta-policy-controls"><label><input v-model="allowRemoved" type="checkbox"> Allow removed tests</label><label><input v-model="allowSkipped" type="checkbox"> Allow newly skipped tests</label></div>
    <div class="delta-gates" :class="{ 'is-tracing': pulse }"><button v-for="(gate, position) in gates" :key="gate.title" type="button" :aria-pressed="index === position" :data-gate="position" :class="{ blocked: gate.blocked }" @click="select(position)"><span>0{{ position + 1 }}</span><svg :key="version" viewBox="0 0 48 48" aria-hidden="true"><path :d="gate.icon" /></svg><strong>{{ gate.title }}</strong><span :data-testid="position === 2 ? 'delta-verdict' : undefined">{{ gate.value }}</span></button></div>
    <div class="delta-explanation" aria-live="polite"><h4>{{ gates[index].title }}</h4><p>{{ gates[index].detail }}</p><p v-if="evaluated.error" class="delta-error" data-testid="delta-policy-error">{{ evaluated.error }}</p><template v-else-if="result"><p class="delta-verdict-line">Expected CLI exit <strong data-testid="delta-exit">{{ result.verdict === 'pass' ? 0 : 1 }}</strong><span>for this policy</span></p><ul v-if="result.reasons.length" data-testid="delta-reasons"><li v-for="reason in result.reasons" :key="reason">{{ reason }}</li></ul><p v-else data-testid="delta-reasons">No candidate failures or unpermitted coverage gaps.</p></template></div>
    <div class="delta-timing-panel">
      <div class="delta-timing-heading"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="27" r="17" /><path d="M18 4h12 M24 4v6 M24 17v12h10" /></svg><div><h4>Timing is a separate advisory signal.</h4><p>Only passed → passed pairs are comparable. Both limits must be exceeded.</p></div></div>
      <div class="delta-timing-inputs"><label>Ratio limit<input v-model="ratio" type="number" min="1.01" step="0.1"></label><label>Absolute limit (ms)<input v-model="milliseconds" type="number" min="0" step="1"></label><template v-if="scenario === 'timing'"><label>Baseline time (ms)<input v-model="before" type="number" min="0" step="1"></label><label>Candidate time (ms)<input v-model="after" type="number" min="0" step="1"></label></template></div>
      <template v-if="scenario === 'timing'"><div class="delta-options delta-presets" role="group" aria-label="Timing boundary examples"><button type="button" @click="preset(200, 300)">At both limits</button><button type="button" @click="preset(200, 301)">Just over both</button><button type="button" @click="preset(0, 101)">Zero baseline</button></div><p class="delta-demo-note">Boundary examples use the default limits: ratio 1.5 and 100 ms.</p></template>
      <div v-if="result" class="delta-timing-output" data-testid="delta-policy-timing"><template v-if="scenario === 'timing'"><div class="delta-timing-bars"><div><span>Before · {{ before }} ms</span><i :style="{ width: `${Math.max(2, Number(before) / Math.max(Number(before), Number(after), 1) * 100)}%` }" /></div><div><span>After · {{ after }} ms</span><i :style="{ width: `${Math.max(2, Number(after) / Math.max(Number(before), Number(after), 1) * 100)}%` }" /></div></div><p><strong>{{ result.rows[0].timing }}</strong> · Δ {{ result.rows[0].deltaMs }} ms · ratio {{ result.rows[0].ratio === null ? 'undefined (JSON null)' : result.rows[0].ratio?.toFixed(3) }}</p></template><p v-else><strong>{{ result.counts.slower }}</strong> slower · <strong>{{ result.counts.faster }}</strong> faster · timing does not change <strong>{{ result.verdict }}</strong></p></div>
    </div>
    <p class="delta-demo-note">{{ scenario === 'sample' ? 'The bundled sample is unchanged.' : 'This is a labelled synthetic boundary example.' }} The original comparison core computes every result here. Exit status is explained, not executed in a terminal. {{ reduced ? 'Reduced motion is on.' : 'Click a gate to inspect its rule.' }}</p>
  </div>
</template>
