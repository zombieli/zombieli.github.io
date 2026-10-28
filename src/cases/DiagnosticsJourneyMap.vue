<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import stages from '../data/diagnostics-journey.json'
import './diagnostics-map.css'

const { index: selected, pulse: activated, version: selectionVersion, select: selectStage } = useJourneyPlayback(() => stages.length)
const board = ref<HTMLElement | null>(null)
const connections = ref<string[]>([])
const shortLabels = ['Scope', 'Protocol', 'Modules', 'Recovery', 'Verify', 'Evidence']
const artifacts = [
  { title: 'Define the test before building the bench.', output: 'Scope + acceptance criteria', detail: 'Local TCP, synthetic readings and explicit failure expectations set a reproducible first boundary.' },
  { title: 'Turn “valid” into a contract.', output: 'diagnostics-sim/1', detail: 'Message identity, required fields and bounded frames make each response testable.' },
  { title: 'Give every failure a place to belong.', output: 'Five module boundaries', detail: 'Separate simulation, transport, validation, orchestration and evidence export.' },
  { title: 'Recover only when recovery makes sense.', output: 'Recorded attempts + retry policy', detail: 'A connection can recover. An invalid message takes the stop path.' },
  { title: 'Check that failure stays visible.', output: 'Expected / observed / outcome', detail: 'Compare two saved runs to see how the same diagnostic can lead to PASS or FAIL.' },
  { title: 'Make the result reproducible.', output: 'report.json + cases.csv + events.jsonl', detail: 'Package the configuration, source identity and observations alongside the runnable code.' },
]
const artifact = computed(() => artifacts[selected.value]!)
const stage = computed(() => stages[selected.value]!)
let observer: ResizeObserver | undefined
let frame: number | undefined

function measureConnections() {
  if (frame !== undefined) window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    if (!board.value) return
    const bounds = board.value.getBoundingClientRect()
    const nodes = [...board.value.querySelectorAll<HTMLElement>('.map-symbol')].map(node => {
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
  <section id="build-map" class="diagnostics-map wrap" data-testid="journey-map" aria-labelledby="build-map-title">
    <div class="map-heading"><div><p class="eyebrow">The build, at a glance</p><h2 id="build-map-title">Follow a decision into the next stage.</h2></div><p>Select a node to see what it produced.</p></div>
    <div ref="board" class="map-board" role="group" aria-label="Development stages">
      <svg class="map-connections" aria-hidden="true">
        <defs><marker id="build-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs>
        <path v-for="(path, index) in connections" :key="index" :d="path" class="map-connection" :class="{ 'is-reached': index < selected }" marker-end="url(#build-map-arrow)" />
        <path v-if="activated && selected > 0 && connections[selected - 1]" :key="selectionVersion" :d="connections[selected - 1]" pathLength="1" class="map-trace" />
      </svg>
      <button v-for="(item, index) in stages" :key="item.id" type="button" class="map-node" :class="{ 'is-selected': selected === index }" :data-stage="item.id" :aria-pressed="selected === index" aria-controls="build-map-artifact" @click="selectStage(index)">
        <span class="map-symbol">
          <svg viewBox="0 0 80 64" aria-hidden="true">
            <g v-if="index === 0"><circle class="symbol-soft" cx="30" cy="30" r="22" /><circle cx="30" cy="30" r="13" /><circle class="symbol-solid" cx="30" cy="30" r="4" /><path d="M 30 30 L 51 9 M 43 9 H 51 V 17 M 57 34 H 72 M 57 43 H 72 M 57 52 H 66" /></g>
            <g v-else-if="index === 1"><path class="symbol-soft" d="M 17 6 H 51 L 63 18 V 58 H 17 Z" /><path d="M 51 6 V 18 H 63 M 32 27 L 26 33 L 32 39 M 47 27 L 53 33 L 47 39 M 39 25 L 36 41 M 28 49 H 51" /></g>
            <g v-else-if="index === 2"><path d="M 40 20 V 35 M 15 44 V 35 H 65 V 44" /><rect class="symbol-soft" x="27" y="5" width="26" height="17" rx="3" /><rect x="4" y="44" width="22" height="15" rx="3" /><rect x="29" y="44" width="22" height="15" rx="3" /><rect x="54" y="44" width="22" height="15" rx="3" /></g>
            <g v-else-if="index === 3"><rect class="symbol-soft" x="3" y="22" width="20" height="24" rx="4" /><rect class="symbol-soft" x="57" y="22" width="20" height="24" rx="4" /><path d="M 23 34 H 33 M 47 34 H 57 M 36 28 L 44 40 M 44 28 L 36 40 M 14 19 C 14 -2 65 -2 65 19 M 59 13 L 65 19 L 71 13 M 65 49 C 65 65 14 65 14 49" /></g>
            <g v-else-if="index === 4"><path d="M 18 17 H 40 V 31 M 62 17 H 40 M 40 39 V 52 H 57" /><circle class="symbol-soft" cx="18" cy="17" r="12" /><circle class="symbol-soft" cx="62" cy="17" r="12" /><path d="M 12 17 L 16 21 L 24 13 M 57 12 L 67 22 M 67 12 L 57 22" /><path class="symbol-soft" d="M 40 25 L 50 35 L 40 45 L 30 35 Z" /><path d="M 57 47 L 64 52 L 57 57" /></g>
            <g v-else><path class="symbol-soft" d="M 7 12 H 30 L 37 20 H 73 V 55 H 7 Z" /><path d="M 7 25 H 73 M 24 30 V 44 M 19 39 L 24 44 L 29 39 M 39 33 H 60 M 39 42 H 60" /><path d="M 45 12 V 3 M 40 7 L 45 12 L 50 7" /></g>
          </svg>
        </span>
        <span class="map-node-label"><span class="map-node-number">{{ String(index + 1).padStart(2, '0') }}</span>{{ shortLabels[index] }}</span>
      </button>
    </div>
    <div id="build-map-artifact" class="map-artifact" aria-live="polite">
      <div><p class="map-stage-label">{{ stage.label }}</p><h3>{{ artifact.title }}</h3><p>{{ artifact.detail }}</p></div>
      <div class="map-deliverable"><span>Produced in this stage</span><strong data-testid="journey-map-artifact">{{ artifact.output }}</strong><a class="text-link" :href="`#${stage.id}`">Explore this stage</a></div>
    </div>
  </section>
</template>
