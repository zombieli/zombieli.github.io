<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import stages from '../data/workflow-journey.json'
import './workflow-map.css'

const { index: selected, pulse: activated, version: selectionVersion, select: selectStage } = useJourneyPlayback(() => stages.length)
const board = ref<HTMLElement | null>(null)
const connections = ref<string[]>([])
const stage = computed(() => stages[selected.value]!)
let observer: ResizeObserver | undefined
let frame: number | undefined

function measureConnections() {
  if (frame !== undefined) window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    if (!board.value) return
    const bounds = board.value.getBoundingClientRect()
    const nodes = [...board.value.querySelectorAll<HTMLElement>('.workflow-map-symbol')].map(node => {
      const rect = node.getBoundingClientRect()
      return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2, w: rect.width, h: rect.height }
    })
    connections.value = nodes.slice(0, -1).map((from, index) => {
      const to = nodes[index + 1]!
      if (Math.abs(from.y - to.y) < 5) {
        const direction = Math.sign(to.x - from.x)
        return `M ${from.x + direction * (from.w / 2 + 5)} ${from.y} L ${to.x - direction * (to.w / 2 + 8)} ${to.y}`
      }
      return `M ${from.x} ${from.y + from.h / 2 + 8} L ${to.x} ${to.y - to.h / 2 - 12}`
    })
  })
}


onMounted(() => {
  observer = new ResizeObserver(measureConnections)
  if (board.value) observer.observe(board.value)
  measureConnections()
})

onUnmounted(() => {
  observer?.disconnect()
  if (frame !== undefined) window.cancelAnimationFrame(frame)
})
</script>

<template>
  <section id="workflow-build-map" class="workflow-build-map wrap" data-testid="workflow-journey-map" aria-labelledby="workflow-build-map-title">
    <div class="workflow-map-heading"><div><p class="eyebrow">The build, at a glance</p><h2 id="workflow-build-map-title">From a fault report to a dependable record.</h2></div><p>Select a stage to inspect its decision and deliverable.</p></div>
    <div ref="board" class="workflow-map-board" role="group" aria-label="Development stages">
      <svg class="workflow-map-connections" aria-hidden="true">
        <defs><marker id="workflow-build-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs>
        <path v-for="(path, index) in connections" :key="index" :d="path" class="workflow-map-connection" :class="{ 'is-reached': index < selected }" marker-end="url(#workflow-build-map-arrow)" />
        <path v-if="activated && selected > 0 && connections[selected - 1]" :key="selectionVersion" :d="connections[selected - 1]" pathLength="1" class="workflow-map-trace" />
      </svg>
      <button v-for="(item, index) in stages" :key="item.id" type="button" class="workflow-map-node" :class="{ 'is-selected': selected === index }" :data-stage="item.id" :aria-pressed="selected === index" aria-controls="workflow-map-artifact" @click="selectStage(index)">
        <span class="workflow-map-symbol">
          <svg viewBox="0 0 80 64" aria-hidden="true">
            <g v-if="index === 0"><rect class="workflow-symbol-soft" x="17" y="9" width="46" height="50" rx="3" /><rect x="29" y="4" width="22" height="10" rx="3" /><path d="M 27 26 H 52 M 27 34 H 45 M 27 48 H 39" /><circle cx="52" cy="47" r="8" /><path d="M 52 42 V 47 M 52 51 H 52.1" /></g>
            <g v-else-if="index === 1"><path d="M 22 16 H 58 M 65 23 V 43 M 58 50 H 22 M 15 43 V 23 M 39 12 L 43 16 L 39 20 M 39 46 L 35 50 L 39 54" /><circle class="workflow-symbol-soft" cx="15" cy="16" r="8" /><circle class="workflow-symbol-soft" cx="65" cy="16" r="8" /><circle class="workflow-symbol-soft" cx="65" cy="50" r="8" /><circle class="workflow-symbol-soft" cx="15" cy="50" r="8" /><path d="M 12 16 H 18 M 15 13 V 19 M 61 50 L 64 53 L 69 47" /></g>
            <g v-else-if="index === 2"><rect class="workflow-symbol-soft" x="26" y="4" width="28" height="19" rx="3" /><path d="M 26 10 H 54 M 40 23 V 34 M 16 42 V 34 H 64 V 42" /><rect x="3" y="42" width="26" height="18" rx="3" /><rect x="51" y="42" width="26" height="18" rx="3" /><path d="M 9 48 H 23 M 9 54 H 18 M 57 48 L 61 51 L 57 54 M 65 54 H 70" /></g>
            <g v-else-if="index === 3"><path d="M 14 15 H 6 V 56 H 14 M 66 15 H 74 V 56 H 66" /><rect class="workflow-symbol-soft" x="15" y="24" width="22" height="30" rx="2" /><rect class="workflow-symbol-soft" x="43" y="24" width="22" height="30" rx="2" /><path d="M 21 32 H 31 M 21 39 H 31 M 49 32 H 59 M 49 39 H 59 M 37 46 H 43" /><path d="M 31 12 L 37 18 L 49 6" /></g>
            <g v-else-if="index === 4"><rect class="workflow-symbol-soft" x="11" y="7" width="42" height="47" rx="3" /><path d="M 25 7 V 54 M 39 7 V 54 M 11 22 H 53 M 11 38 H 53 M 15 15 L 18 18 L 22 12 M 29 27 L 35 33 M 35 27 L 29 33" /><circle cx="59" cy="44" r="11" /><path d="M 67 52 L 76 61 M 54 44 L 58 48 L 65 40" /></g>
            <g v-else><rect class="workflow-symbol-soft" x="4" y="7" width="45" height="35" rx="3" /><path d="M 4 16 H 49 M 11 11 H 12 M 17 11 H 18 M 20 42 V 51 M 12 51 H 36" /><path class="workflow-symbol-soft" d="M 44 34 L 59 27 L 74 34 V 53 L 59 60 L 44 53 Z" /><path d="M 44 34 L 59 41 L 74 34 M 59 41 V 60 M 52 31 L 67 38" /></g>
          </svg>
        </span>
        <span class="workflow-map-node-label"><span class="workflow-map-node-number">{{ String(index + 1).padStart(2, '0') }}</span>{{ item.shortLabel }}</span>
      </button>
    </div>
    <div id="workflow-map-artifact" class="workflow-map-artifact" aria-live="polite">
      <div><p class="workflow-map-stage-label">{{ stage.label }}</p><h3>{{ stage.title }}</h3><p>{{ stage.detail }}</p></div>
      <div class="workflow-map-deliverable"><span>Produced in this stage</span><strong data-testid="workflow-map-artifact">{{ stage.artifact }}</strong><a class="text-link" :href="`#${stage.id}`">Explore this stage</a></div>
    </div>
  </section>
</template>
