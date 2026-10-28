<script lang="ts">
export type RecordedFlowStep = {
  id: string
  label: string
  value: string
  detail: string
  kind: 'observation' | 'decision' | 'outcome'
  failed?: boolean
}
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useJourneyPlayback, journeyStepDuration } from '../lib/journey-motion'

const props = defineProps<{
  id: string
  label: string
  context: string
  steps: RecordedFlowStep[]
  resetRequest: number
}>()
const { index: current, playing, reduced: reducedMotion, stop: pause, select: selectStep, replay } = useJourneyPlayback(() => props.steps.length)
const currentStep = computed(() => props.steps[current.value])
const stepDuration = journeyStepDuration
watch([() => props.context, () => props.resetRequest, () => props.steps], () => { pause(); current.value = 0 })
</script>

<template>
  <div class="recorded-flow" :data-testid="id" :data-playing="String(playing)" :aria-label="label" role="group">
    <div class="recorded-flow-toolbar">
      <span>Follow the saved sequence</span>
      <button class="recorded-flow-control" type="button" @click="playing ? pause() : replay()">{{ playing ? 'Pause flow' : 'Replay flow' }}</button>
    </div>
    <ol class="recorded-flow-track" :style="{ '--flow-steps': steps.length, '--flow-duration': `${stepDuration}ms` }" :aria-label="label">
      <li v-for="(step, index) in steps" :key="step.id" class="recorded-flow-stage" :class="{ 'is-reached': index <= current, 'is-current': index === current, 'is-failed': step.failed }">
        <span v-if="index < steps.length - 1" class="recorded-flow-connector" :class="{ 'is-reached': index < current }" aria-hidden="true"><span v-if="playing && index === current" class="recorded-flow-packet" /></span>
        <button class="recorded-flow-step" type="button" :data-flow-step="step.id" :aria-current="index === current ? 'step' : undefined" :aria-controls="`${id}-detail`" @click="selectStep(index)">
          <span class="recorded-flow-symbol" :class="`is-${step.kind}`" aria-hidden="true"><span>{{ index + 1 }}</span></span>
          <span class="recorded-flow-label">{{ step.label }}</span>
          <strong>{{ step.value }}</strong>
        </button>
      </li>
    </ol>
    <div v-if="currentStep" :id="`${id}-detail`" class="recorded-flow-detail" :aria-live="playing ? 'off' : 'polite'" aria-atomic="true">
      <span>Step {{ current + 1 }} of {{ steps.length }} · {{ currentStep.label }}</span>
      <p>{{ currentStep.detail }}</p>
    </div>
    <p class="recorded-flow-note">{{ reducedMotion ? 'Reduced motion is on. Select any step to explore. ' : 'Select a step to inspect it, or replay the path. ' }}Animation timing is illustrative; the saved simulator reports are unchanged.</p>
  </div>
</template>
