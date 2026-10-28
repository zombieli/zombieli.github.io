<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import { calculateValidatedMetrics, checkSchedule, getValidationCase, validationCases, validationChecks, violationDescriptions, type ValidationCaseId } from '../lib/scheduling-validation'
import './scheduling-validation.css'

const selected = ref<ValidationCaseId>('valid')
const example = computed(() => getValidationCase(selected.value))
const errors = computed(() => checkSchedule(example.value.jobs, example.value.slots))
const { index: position, playing, reduced: reducedMotion, stop: pause, select: chooseCheck, replay } = useJourneyPlayback(() => validationChecks.length)
const current = computed(() => validationChecks[position.value])
const atGate = computed(() => position.value === validationChecks.length - 1)
const currentErrors = computed(() => atGate.value ? errors.value : errors.value.filter(code => current.value.codes.includes(code)))
const metrics = computed(() => atGate.value && !errors.value.length ? calculateValidatedMetrics(example.value.jobs, example.value.slots) : null)
function chooseCase(id: ValidationCaseId) { pause(); selected.value = id; position.value = 0 }
const coordinate = (minute: number) => `${(minute + 2) / 14 * 100}%`
</script>

<template>
  <div class="scheduling-validation" data-testid="scheduling-validation" :data-playing="String(playing)">
    <div class="validation-heading"><p>Interactive explanation · source-test example</p><h3>Can this schedule reach the metrics?</h3></div>
    <div class="validation-options" role="group" aria-label="Candidate schedule"><button v-for="item in validationCases" :key="item.id" type="button" :data-validation-case="item.id" :aria-pressed="selected === item.id" aria-controls="validation-candidate" @click="chooseCase(item.id)">{{ item.label }}</button></div>
    <p class="validation-explanation">{{ example.explanation }}</p>
    <div id="validation-candidate" class="validation-candidate">
      <div class="validation-inputs"><span><strong>a</strong> release 0 · duration 4 min</span><span><strong>b</strong> release 0 · duration 2 min</span></div>
      <div class="validation-axis" aria-hidden="true"><span v-for="minute in [-2, 0, 4, 8, 12]" :key="minute" :style="{ left: coordinate(minute) }">{{ minute }}</span></div>
      <div v-for="(slot, index) in example.slots" :key="index" class="validation-slot" :class="{ 'is-corrupt': index === example.changedIndex }">
        <div class="validation-slot-track" aria-hidden="true"><span class="validation-zero" :style="{ left: coordinate(0) }" /><span class="validation-slot-bar" :style="{ left: coordinate(slot.start), width: `${(slot.end - slot.start) / 14 * 100}%` }">{{ slot.job_id }}</span></div>
        <p>Slot {{ index + 1 }}: job <strong>{{ slot.job_id }}</strong>, {{ slot.start }}–{{ slot.end }} min</p>
      </div>
      <p class="validation-axis-note">Time in minutes. Dashed line: release at 0. Empty space between jobs must include a two-minute changeover.</p>
    </div>
    <div class="validation-toolbar"><span>Independent checks</span><button type="button" @click="playing ? pause() : replay()">{{ playing ? 'Pause checks' : 'Replay checks' }}</button></div>
    <ol class="validation-track">
      <li v-for="(check, index) in validationChecks" :key="check.id" :class="{ 'is-current': position === index, 'is-reached': index <= position, 'is-failed': (check.id === 'metrics' ? errors.length > 0 : errors.some(code => check.codes.includes(code))) && index <= position }">
        <span v-if="index < validationChecks.length - 1" class="validation-connector" aria-hidden="true"><span v-if="playing && position === index" class="validation-packet" /></span>
        <button type="button" :data-check="check.id" :aria-current="position === index ? 'step' : undefined" aria-controls="validation-check-detail" @click="chooseCheck(index)">
          <span class="validation-icon" aria-hidden="true"><svg viewBox="0 0 40 40">
            <g v-if="check.id === 'coverage'"><rect x="5" y="7" width="13" height="26" rx="2" /><rect x="23" y="7" width="12" height="26" rx="2" /><path d="M 9 16 H 14 M 9 22 H 14 M 26 16 H 32 M 26 22 H 32" /></g>
            <g v-else-if="check.id === 'release'"><circle cx="20" cy="20" r="15" /><path d="M 20 9 V 20 L 28 25 M 6 5 H 12 M 5 6 V 12" /></g>
            <g v-else-if="check.id === 'duration'"><rect x="5" y="11" width="30" height="18" rx="2" /><path d="M 11 11 V 18 M 17 11 V 16 M 23 11 V 18 M 29 11 V 16" /></g>
            <g v-else-if="check.id === 'gap'"><path d="M 6 7 V 33 M 34 7 V 33 M 11 20 H 29 M 11 20 L 16 15 M 11 20 L 16 25 M 29 20 L 24 15 M 29 20 L 24 25" /></g>
            <g v-else><path d="M 6 5 V 34 H 35 M 13 29 V 22 H 18 V 29 M 23 29 V 12 H 28 V 29" /></g>
          </svg></span><strong>{{ check.label }}</strong>
        </button>
      </li>
    </ol>
    <div id="validation-check-detail" class="validation-detail" :aria-live="playing ? 'off' : 'polite'" aria-atomic="true"><span>Check {{ position + 1 }} of 5 · {{ current.label }}</span><p>{{ current.detail }}</p><ul v-if="currentErrors.length" class="validation-problems"><li v-for="code in currentErrors" :key="code"><code>{{ code }}</code><span>{{ violationDescriptions[code] }}</span></li></ul><p v-else class="validation-clear">{{ atGate ? 'All checks pass. This candidate may enter the metrics calculation.' : 'This candidate passes this check.' }}</p></div>
    <div class="validation-result" :class="{ 'is-rejected': atGate && errors.length > 0 }" :aria-live="playing ? 'off' : 'polite'"><div><span>Candidate result</span><strong data-validation-outcome>{{ atGate ? errors.length ? 'Rejected' : 'Accepted' : 'Ready' }}</strong></div><div><span>Waiting metrics</span><strong data-metrics-gate>{{ atGate ? errors.length ? 'Blocked' : 'Available' : 'Not calculated' }}</strong></div></div>
    <dl v-if="metrics" class="validation-metrics" data-testid="validation-metrics"><div><dt>Mean wait</dt><dd>{{ metrics.mean_wait_min }} min</dd></div><div><dt>Longest wait</dt><dd>{{ metrics.max_wait_min }} min</dd></div><div><dt>Finish</dt><dd>{{ metrics.finish_min }} min</dd></div></dl>
    <p class="validation-note">{{ reducedMotion ? 'Reduced motion is on. Select a check to explore. ' : 'Select a check, or replay the sequence. ' }}These deliberately modified examples illustrate the Python validator’s rules; they are separate from the saved experiment results. Checks are grouped for explanation and animation timing is illustrative.</p>
  </div>
</template>
