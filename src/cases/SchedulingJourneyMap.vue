<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import stages from '../data/scheduling-journey.json'
import './scheduling-map.css'

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
    const nodes = [...board.value.querySelectorAll<HTMLElement>('.scheduling-map-symbol')].map(node => {
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
  <section id="scheduling-build-map" class="scheduling-build-map wrap" data-testid="scheduling-journey-map" aria-labelledby="scheduling-build-map-title">
    <div class="scheduling-map-heading"><div><p class="eyebrow">The build, at a glance</p><h2 id="scheduling-build-map-title">From a waiting-time question to a checked result.</h2></div><p>Select a stage to inspect its decision and deliverable.</p></div>
    <div ref="board" class="scheduling-map-board" role="group" aria-label="Development stages">
      <svg class="scheduling-map-connections" aria-hidden="true">
        <defs><marker id="scheduling-build-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs>
        <path v-for="(path, index) in connections" :key="index" :d="path" class="scheduling-map-connection" :class="{ 'is-reached': index < selected }" marker-end="url(#scheduling-build-map-arrow)" />
        <path v-if="activated && selected > 0 && connections[selected - 1]" :key="selectionVersion" :d="connections[selected - 1]" pathLength="1" class="scheduling-map-trace" />
      </svg>
      <button v-for="(item, index) in stages" :key="item.id" type="button" class="scheduling-map-node" :class="{ 'is-selected': selected === index }" :data-stage="item.id" :aria-pressed="selected === index" aria-controls="scheduling-map-artifact" @click="selectStage(index)">
        <span class="scheduling-map-symbol"><svg viewBox="0 0 80 64" aria-hidden="true">
          <g v-if="index === 0"><circle class="scheduling-symbol-soft" cx="27" cy="32" r="21" /><path d="M 27 18 V 32 L 37 38 M 53 18 C 53 9 70 9 70 18 C 70 25 61 25 61 32 M 61 39 H 61.1 M 49 52 H 72" /></g>
          <g v-else-if="index === 1"><path class="scheduling-symbol-soft" d="M 6 35 H 74 V 43 H 6 Z" /><path d="M 13 43 V 59 M 67 43 V 59 M 6 59 H 20 M 60 59 H 74" /><rect x="27" y="10" width="26" height="25" rx="3" /><path d="M 33 18 H 47 M 33 25 H 41 M 5 19 H 19 M 14 14 L 19 19 L 14 24 M 61 19 H 75 M 70 14 L 75 19 L 70 24" /></g>
          <g v-else-if="index === 2"><rect class="scheduling-symbol-soft" x="5" y="8" width="33" height="10" rx="2" /><rect x="5" y="27" width="21" height="10" rx="2" /><rect x="5" y="46" width="27" height="10" rx="2" /><path d="M 43 13 H 49 V 32 H 57 M 31 32 H 57 M 37 51 H 49 V 32 M 52 27 L 57 32 L 52 37" /><rect class="scheduling-symbol-soft" x="60" y="23" width="15" height="18" rx="2" /></g>
          <g v-else-if="index === 3"><path class="scheduling-symbol-soft" d="M 40 5 L 65 15 V 34 C 65 45 53 55 40 60 C 27 55 15 45 15 34 V 15 Z" /><path d="M 25 24 L 28 27 L 33 21 M 39 24 H 54 M 25 35 L 28 38 L 33 32 M 39 35 H 54 M 25 46 L 28 49 L 33 43 M 39 46 H 49" /></g>
          <g v-else-if="index === 4"><path d="M 8 8 V 56 H 73 M 15 56 V 59 M 40 56 V 59 M 65 56 V 59" /><rect class="scheduling-symbol-soft" x="17" y="16" width="11" height="34" rx="1" /><rect x="30" y="31" width="11" height="19" rx="1" /><rect class="scheduling-symbol-soft" x="49" y="34" width="11" height="16" rx="1" /><rect x="62" y="10" width="11" height="40" rx="1" /></g>
          <g v-else><path class="scheduling-symbol-soft" d="M 8 20 H 31 L 38 28 H 73 V 57 H 8 Z" /><path d="M 8 34 H 73 M 16 43 H 35 M 16 50 H 30" /><path d="M 43 4 H 62 L 69 11 V 28 H 43 Z M 62 4 V 11 H 69 M 49 17 H 62 M 49 23 H 58 M 44 42 H 65 M 44 49 H 58" /></g>
        </svg></span>
        <span class="scheduling-map-node-label"><span class="scheduling-map-node-number">{{ String(index + 1).padStart(2, '0') }}</span>{{ item.shortLabel }}</span>
      </button>
    </div>
    <div id="scheduling-map-artifact" class="scheduling-map-artifact" aria-live="polite">
      <div><p class="scheduling-map-stage-label">{{ stage.label }}</p><h3>{{ stage.title }}</h3><p>{{ stage.detail }}</p></div>
      <div class="scheduling-map-deliverable"><span>Produced in this stage</span><strong data-testid="scheduling-map-artifact">{{ stage.artifact }}</strong><a class="text-link" :href="`#${stage.id}`">Explore this stage</a></div>
    </div>
  </section>
</template>
