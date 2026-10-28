<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import stages from '../data/delta-journey.json'
import './delta-map.css'
const { index: selected, pulse: animating, version, select } = useJourneyPlayback(() => stages.length)
const stage = computed(() => stages[selected.value]!)
const board = ref<HTMLElement | null>(null)
const connections = ref<string[]>([])
const symbols = [
  'M7 8h23v43H7z M50 8h23v43H50z M12 19h13 M12 28h13 M55 19h13 M55 28h13 M35 22h10 M40 17v10 M35 39h10 M40 35v1 M40 43v1',
  'M12 8H5v46h7 M68 8h7v46h-7 M21 16h17v12H21z M45 16h17v12H45z M21 37h17v12H21z M45 37h17v12H45z M38 22h7 M38 43h7',
  'M5 6h19v18H5z M5 40h19v18H5z M24 15h10v17h9 M24 49h10V32 M43 20h21v24H43z M48 27l4 5-4 5 M56 37h4 M64 32h12',
  'M5 31h13 M18 16h20v30H18z M23 30l5 5 7-12 M38 31h12 M50 16h23v30H50z M57 25l10 12 M67 25L57 37 M28 46v11h34V46',
  'M5 10h19v13H5z M5 42h19v13H5z M24 16h39 M24 48h39 M39 12v9 M49 44v9 M63 8v48 M57 24l6-8-6-8 M57 40l6 8-6 8 M29 27l8 8 M37 27l-8 8',
  'M5 7h45v35H5z M5 15h45 M13 23l5 5-5 5 M23 33h12 M20 42v10 M11 52h27 M48 36l14-8 13 8v18l-13 8-14-8z M48 36l14 8 13-8 M62 44v18',
]
let frame: number | undefined
let observer: ResizeObserver | undefined
function measure() {
  if (frame !== undefined) window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    if (!board.value) return
    const bounds = board.value.getBoundingClientRect()
    const nodes = [...board.value.querySelectorAll('.delta-map-symbol')].map(node => {
      const rect = node.getBoundingClientRect()
      return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 }
    })
    connections.value = nodes.slice(0, -1).map((from, index) => {
      const to = nodes[index + 1]!
      if (Math.abs(from.y - to.y) < 5) { const sign = Math.sign(to.x - from.x); return `M ${from.x + sign * 45} ${from.y} L ${to.x - sign * 48} ${to.y}` }
      return `M ${from.x} ${from.y + 40} L ${to.x} ${to.y - 44}`
    })
  })
}
onMounted(() => { observer = new ResizeObserver(measure); if (board.value) observer.observe(board.value); measure() })
onUnmounted(() => { observer?.disconnect(); if (frame !== undefined) window.cancelAnimationFrame(frame) })
</script>

<template>
  <section id="delta-build-map" class="delta-map wrap" data-testid="delta-journey-map" :data-playing="animating" aria-labelledby="delta-build-map-title">
    <div class="delta-map-heading"><div><p class="delta-map-eyebrow">The build, at a glance</p><h2 id="delta-build-map-title">From two test runs to an explainable decision.</h2></div><p>Select a stage to inspect its decision and deliverable.</p></div>
    <div ref="board" class="delta-map-board" role="group" aria-label="Development stages">
      <svg class="delta-map-connections" aria-hidden="true"><defs><marker id="delta-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L7 4L1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs><path v-for="(path, index) in connections" :key="index" :d="path" class="delta-map-connection" :class="{ 'delta-map-connection-reached': index < selected }" marker-end="url(#delta-map-arrow)" /><path v-if="animating && selected > 0" :key="version" :d="connections[selected - 1]" pathLength="1" class="delta-map-trace" /></svg>
      <button v-for="(item, index) in stages" :key="item.id" type="button" class="delta-map-node" :class="{ 'delta-map-node-selected': selected === index }" :data-stage="item.id" :aria-pressed="selected === index" aria-controls="delta-map-artifact" @click="select(index)"><span class="delta-map-symbol"><svg viewBox="0 0 80 64" aria-hidden="true"><path :d="symbols[index]" /><path v-if="animating && selected === index" :key="version" :d="symbols[index]" pathLength="1" class="delta-map-symbol-trace" /></svg></span><span class="delta-map-node-label"><span class="delta-map-node-number">{{ String(index + 1).padStart(2, '0') }}</span>{{ item.shortLabel }}</span></button>
    </div>
    <div id="delta-map-artifact" class="delta-map-artifact" aria-live="polite" aria-atomic="true"><div><p class="delta-map-stage-label">{{ stage.label }}</p><h3>{{ stage.title }}</h3><p>{{ stage.detail }}</p></div><div class="delta-map-deliverable"><span>Produced in this stage</span><strong data-testid="delta-map-artifact">{{ stage.artifact }}</strong><a class="delta-map-explore" :href="`#${stage.id}`">Explore this stage</a></div></div>
  </section>
</template>
