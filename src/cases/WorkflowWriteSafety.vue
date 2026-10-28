<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJourneyPlayback, journeyStepDuration } from '../lib/journey-motion'
import { getWriteScenario, writeScenarioOptions, type WriteScenarioId } from '../lib/workflow-write-safety'
import './workflow-write-safety.css'

const selected = ref<WriteScenarioId>('accepted')
const scenario = computed(() => getWriteScenario(selected.value))
const { index: position, playing, reduced: reducedMotion, stop: pause, select: chooseStep, replay } = useJourneyPlayback(() => scenario.value.steps.length)
const current = computed(() => scenario.value.steps[position.value])
const duration = journeyStepDuration
function chooseScenario(id: WriteScenarioId) { pause(); selected.value = id; position.value = 0 }
</script>

<template>
  <div class="workflow-write-safety" data-testid="workflow-write-safety">
    <div class="write-heading"><p class="eyebrow">A change and its history</p><h3>What actually gets saved?</h3><p>Select a case, then follow the write through its transaction.</p></div>
    <div class="write-options" role="group" aria-label="Write scenario">
      <button v-for="option in writeScenarioOptions" :key="option.id" type="button" :aria-pressed="selected === option.id" @click="chooseScenario(option.id)">{{ option.label }}</button>
    </div>
    <p class="write-scenario-explanation">{{ scenario.explanation }}</p>
    <div class="write-flow" data-testid="write-flow" :data-playing="String(playing)" role="group" aria-label="API transaction steps">
      <div class="write-toolbar"><span>Request uses <code>expected_version: {{ scenario.request.expectedVersion }}</code></span><button type="button" @click="playing ? pause() : replay()">{{ playing ? 'Pause flow' : 'Replay flow' }}</button></div>
      <ol class="write-track" :style="{ '--write-count': scenario.steps.length, '--write-duration': `${duration}ms` }">
        <li v-for="(step, index) in scenario.steps" :key="`${selected}-${step.id}`" class="write-stage" :class="{ 'is-current': position === index, 'is-reached': index <= position, 'is-failed': step.failed }">
          <span v-if="index < scenario.steps.length - 1" class="write-connector" :class="{ 'is-reached': index < position }" aria-hidden="true"><span v-if="playing && position === index" class="write-packet" /></span>
          <button type="button" class="write-step" :data-write-step="step.id" :aria-current="position === index ? 'step' : undefined" aria-controls="write-step-detail" @click="chooseStep(index)">
            <span class="write-icon" aria-hidden="true"><svg viewBox="0 0 40 40">
              <g v-if="step.id === 'request'"><path d="M 9 4 H 24 L 31 11 V 35 H 9 Z M 24 4 V 11 H 31 M 14 17 H 25 M 14 23 H 25 M 14 29 H 22" /></g>
              <g v-else-if="step.id === 'check'"><rect x="8" y="17" width="24" height="19" rx="3" /><path d="M 13 17 V 11 A 7 7 0 0 1 27 11 V 17 M 20 24 V 29" /></g>
              <g v-else-if="step.id === 'update'"><path d="M 29 19 V 34 H 6 V 8 H 21 M 18 23 L 19 16 L 30 5 L 35 10 L 24 21 Z M 27 8 L 32 13 M 12 28 H 21" /></g>
              <g v-else-if="step.id === 'history'"><path d="M 14 8 H 33 M 14 20 H 33 M 14 32 H 26 M 6 8 H 7 M 6 20 H 7 M 6 32 H 7" /><path v-if="step.failed" d="M 29 27 L 37 35 M 37 27 L 29 35" /></g>
              <g v-else-if="step.id === 'commit'"><circle cx="20" cy="20" r="15" /><path d="M 12 20 L 18 26 L 29 14" /></g>
              <g v-else-if="step.id === 'rollback'"><path d="M 13 12 H 25 A 11 11 0 0 1 25 34 H 15 M 13 12 L 20 5 M 13 12 L 20 19" /></g>
              <g v-else><path d="M 13 5 H 27 L 35 13 V 27 L 27 35 H 13 L 5 27 V 13 Z M 14 14 L 26 26 M 26 14 L 14 26" /></g>
            </svg></span>
            <span class="write-step-label">{{ step.label }}</span><strong>{{ step.value }}</strong>
          </button>
        </li>
      </ol>
    </div>
    <div id="write-step-detail" class="write-detail" :aria-live="playing ? 'off' : 'polite'" aria-atomic="true">
      <span>Step {{ position + 1 }} of {{ scenario.steps.length }} · {{ current.label }}</span><p>{{ current.detail }}</p>
    </div>
    <div class="write-ledgers" :aria-live="playing ? 'off' : 'polite'" aria-atomic="true">
      <div class="write-ledger write-committed"><h4>Committed in SQLite</h4><p>What other readers can see</p><dl><div><dt>Order</dt><dd data-committed-status>{{ current.committed.status }}</dd></div><div><dt>Version</dt><dd data-committed-version>{{ current.committed.version }}</dd></div><div><dt>History events</dt><dd data-committed-events>{{ current.committed.events }}</dd></div></dl></div>
      <div class="write-ledger write-pending"><h4>Inside this transaction</h4><p>{{ current.pending ? 'Pending · not committed' : 'No pending writes' }}</p><dl v-if="current.pending"><div><dt>Order</dt><dd>{{ current.pending.status }}</dd></div><div><dt>Version</dt><dd>{{ current.pending.version }}</dd></div><div><dt>History events</dt><dd>{{ current.pending.events }}</dd></div></dl><p v-else class="write-empty">{{ current.id === 'commit' ? 'The two writes have committed together.' : current.id === 'rollback' ? 'The pending update has been discarded.' : 'The stored record and its history stay together.' }}</p></div>
    </div>
    <p class="write-outcome" :class="{ 'is-failed': current.failed }" :aria-live="playing ? 'off' : 'polite'">{{ current.outcome }}</p>
    <p class="write-note">{{ reducedMotion ? 'Reduced motion is on. Select a step to explore. ' : 'Click a step to inspect it, or replay the sequence. ' }}This is an illustrative model of the local API and its tests, using synthetic values. It does not send a request or connect to a database.</p>
  </div>
</template>
