<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import stages from '../data/inspection-journey.json'
import './inspection-map.css'

const { index: selected, pulse, version: selectionVersion, select: selectStage } = useJourneyPlayback(() => stages.length)
const animatingStage = computed(() => pulse.value ? selected.value : null)
const board = ref<HTMLElement | null>(null)
const connections = ref<string[]>([])
const stage = computed(() => stages[selected.value]!)
const symbolTraces = [
  'M 29 24 H 53 M 29 33 H 48 M 29 42 H 53',
  'M 25 24 L 28 27 L 34 20 M 25 36 L 28 39 L 34 32 M 25 48 L 28 51 L 34 44',
  'M 18 29 V 38 H 62 V 43 M 57 38 L 62 43 L 67 38',
  'M 18 11 H 59 L 65 17 M 59 11 L 65 17 L 59 23',
  'M 48 46 L 53 51 L 64 38',
  'M 46 34 L 60 41 L 74 34 M 60 41 V 59',
]
let observer: ResizeObserver | undefined
let frame: number | undefined
function measureConnections() {
  if (frame !== undefined) window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    if (!board.value) return
    const bounds = board.value.getBoundingClientRect()
    const nodes = [...board.value.querySelectorAll<HTMLElement>('.inspection-map-symbol')].map(node => {
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
  <section id="inspection-build-map" class="inspection-map wrap" data-testid="inspection-journey-map" aria-labelledby="inspection-build-map-title">
    <div class="inspection-map-heading">
      <div><p class="inspection-map-eyebrow">The build, at a glance</p><h2 id="inspection-build-map-title">From a local draft to a recoverable record.</h2></div>
      <p>Select a stage to inspect its decision and deliverable.</p>
    </div>
    <div ref="board" class="inspection-map-board" role="group" aria-label="Development stages">
      <svg class="inspection-map-connections" aria-hidden="true" focusable="false">
        <defs><marker id="inspection-build-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs>
        <path v-for="(path, index) in connections" :key="index" :d="path" class="inspection-map-connection" :class="{ 'inspection-map-connection-reached': index < selected }" marker-end="url(#inspection-build-map-arrow)" />
        <path v-if="animatingStage !== null && selected > 0 && connections[selected - 1]" :key="selectionVersion" :d="connections[selected - 1]" pathLength="1" class="inspection-map-trace" />
      </svg>
      <button v-for="(item, index) in stages" :key="item.id" type="button" class="inspection-map-node" :class="{ 'inspection-map-node-selected': selected === index }" :data-stage="item.id" :aria-pressed="selected === index" aria-controls="inspection-map-artifact" @click="selectStage(index)">
        <span class="inspection-map-symbol">
          <svg viewBox="0 0 80 64" aria-hidden="true" focusable="false">
            <g v-if="index === 0">
              <rect class="inspection-map-symbol-soft" x="19" y="5" width="45" height="54" rx="3" />
              <path d="M 24 5 V 59 M 14 16 H 23 M 14 29 H 23 M 14 42 H 23 M 14 53 H 23 M 30 15 H 51 M 30 24 H 53 M 30 33 H 48 M 30 42 H 53" />
              <path d="M 49 51 H 57 M 53 47 V 55" />
            </g>
            <g v-else-if="index === 1">
              <rect class="inspection-map-symbol-soft" x="15" y="8" width="40" height="51" rx="3" />
              <rect x="26" y="4" width="18" height="9" rx="2" />
              <path d="M 25 24 L 28 27 L 34 20 M 39 24 H 47 M 25 36 L 28 39 L 34 32 M 39 36 H 47 M 25 48 L 28 51 L 34 44 M 39 48 H 45" />
              <rect class="inspection-map-symbol-paper" x="49" y="40" width="24" height="19" rx="3" />
              <path d="M 54 40 V 35 A 7 7 0 0 1 68 35 V 40 M 61 47 V 52" />
            </g>
            <g v-else-if="index === 2">
              <rect class="inspection-map-symbol-soft" x="5" y="5" width="36" height="24" rx="3" />
              <path d="M 5 12 H 41 M 11 9 H 12 M 17 9 H 18 M 12 18 H 34 M 12 23 H 27 M 18 29 V 38 H 62 V 43 M 57 38 L 62 43 L 67 38" />
              <path class="inspection-map-symbol-paper" d="M 47 48 C 47 42 77 42 77 48 V 58 C 77 64 47 64 47 58 Z" />
              <ellipse cx="62" cy="48" rx="15" ry="5" />
              <path d="M 52 21 A 17 17 0 0 1 73 21 M 56 27 A 10 10 0 0 1 69 27 M 62 33 H 63 M 51 15 L 74 36" />
            </g>
            <g v-else-if="index === 3">
              <path d="M 18 11 H 59 L 65 17 M 59 11 L 65 17 L 59 23 M 8 23 H 3 V 59 H 8 M 72 23 H 77 V 59 H 72" />
              <path class="inspection-map-symbol-soft" d="M 13 25 H 28 L 34 31 V 55 H 13 Z M 28 25 V 31 H 34" />
              <path d="M 19 38 H 28 M 19 45 H 25 M 38 40 H 44 M 41 37 L 44 40 L 41 43" />
              <path class="inspection-map-symbol-soft" d="M 48 31 C 48 25 69 25 69 31 V 52 C 69 58 48 58 48 52 Z" />
              <ellipse cx="58.5" cy="31" rx="10.5" ry="4.5" /><path d="M 53 43 L 57 47 L 64 38" />
            </g>
            <g v-else-if="index === 4">
              <rect class="inspection-map-symbol-soft" x="9" y="6" width="42" height="47" rx="3" />
              <path d="M 9 18 H 51 M 21 18 V 53 M 9 30 H 51 M 9 42 H 40 M 28 24 H 43 M 28 36 H 38 M 13 24 H 17 M 13 36 H 17 M 13 48 H 17" />
              <circle class="inspection-map-symbol-paper" cx="55" cy="45" r="16" />
              <path d="M 48 46 L 53 51 L 64 38 M 67 57 L 74 63" />
            </g>
            <g v-else>
              <rect class="inspection-map-symbol-soft" x="5" y="6" width="44" height="38" rx="3" />
              <path d="M 5 15 H 49 M 12 10 H 13 M 18 10 H 19 M 19 23 L 13 28 L 19 33 M 35 23 L 41 28 L 35 33 M 29 21 L 25 35 M 24 44 V 53 M 14 53 H 36" />
              <path class="inspection-map-symbol-paper" d="M 46 34 L 60 27 L 74 34 V 52 L 60 59 L 46 52 Z" />
              <path d="M 46 34 L 60 41 L 74 34 M 60 41 V 59 M 53 30 L 67 37" />
            </g>
            <path v-if="animatingStage === index" :key="selectionVersion" :d="symbolTraces[index]" pathLength="1" class="inspection-map-symbol-trace" />
          </svg>
        </span>
        <span class="inspection-map-node-label"><span class="inspection-map-node-number">{{ String(index + 1).padStart(2, '0') }}</span>{{ item.shortLabel }}</span>
      </button>
    </div>
    <div id="inspection-map-artifact" class="inspection-map-artifact" aria-live="polite" aria-atomic="true">
      <div><p class="inspection-map-stage-label">{{ stage.label }}</p><h3>{{ stage.title }}</h3><p>{{ stage.detail }}</p></div>
      <div class="inspection-map-deliverable"><span>Produced in this stage</span><strong data-testid="inspection-map-artifact">{{ stage.artifact }}</strong><a class="inspection-map-explore" :href="`#${stage.id}`">Explore this stage</a></div>
    </div>
  </section>
</template>
