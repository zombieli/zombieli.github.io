<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import stages from '../data/manual-journey.json'
import './manual-map.css'
const { index: selected, pulse: animating, version, select } = useJourneyPlayback(() => stages.length)
const stage = computed(() => stages[selected.value]!)
const board = ref<HTMLElement | null>(null)
const connections = ref<string[]>([])
const symbols = [
  'M8 9h43v33H8z M16 19h25 M16 27h17 M43 39a12 12 0 1 0 24 0a12 12 0 1 0-24 0 M64 48l10 11',
  'M8 12h15v43H8z M28 7h15v48H28z M48 12h15v43H48z M8 47h15 M28 47h15 M48 47h15 M4 58h65 M13 21h5 M33 16h5 M53 21h5',
  'M7 10h17v12H7z M7 39h17v12H7z M24 16h10v16h8 M24 45h10V32 M42 10h32v8H42z M42 28h24v8H42z M42 46h16v8H42z',
  'M8 7h28l9 9v39H8z M36 7v10h9 M16 25h21 M16 33h16 M16 41h19 M48 35l7-7a8 8 0 0 1 11 11l-7 7 M57 35l-7 7a8 8 0 0 0 11 11l7-7',
  'M8 8h8v8H8z M23 8h8v8H23z M38 8h8v8H38z M53 8h8v8H53z M8 24h8v8H8z M23 24h8v8H23z M38 24h8v8H38z M53 24h8v8H53z M8 40h8v8H8z M23 40h8v8H23z M43 42l8 8 M51 42l-8 8 M58 41l5 5 10-12',
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
    const nodes = [...board.value.querySelectorAll('.manual-map-symbol')].map(node => {
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
  <section id="manual-build-map" class="manual-map wrap" data-testid="manual-journey-map" :data-playing="animating" aria-labelledby="manual-build-map-title">
    <div class="manual-map-heading"><div><p class="manual-map-eyebrow">The build, at a glance</p><h2 id="manual-build-map-title">From a query to an inspectable source.</h2></div><p>Select a stage to inspect its decision and deliverable.</p></div>
    <div ref="board" class="manual-map-board" role="group" aria-label="Development stages">
      <svg class="manual-map-connections" aria-hidden="true"><defs><marker id="manual-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L7 4L1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs><path v-for="(path, index) in connections" :key="index" :d="path" class="manual-map-connection" :class="{ 'manual-map-connection-reached': index < selected }" marker-end="url(#manual-map-arrow)" /><path v-if="animating && selected > 0" :key="version" :d="connections[selected - 1]" pathLength="1" class="manual-map-trace" /></svg>
      <button v-for="(item, index) in stages" :key="item.id" type="button" class="manual-map-node" :class="{ 'manual-map-node-selected': selected === index }" :data-stage="item.id" :aria-pressed="selected === index" aria-controls="manual-map-artifact" @click="select(index)"><span class="manual-map-symbol"><svg viewBox="0 0 80 64" aria-hidden="true"><path :d="symbols[index]" /><path v-if="animating && selected === index" :key="version" :d="symbols[index]" pathLength="1" class="manual-map-symbol-trace" /></svg></span><span class="manual-map-node-label"><span class="manual-map-node-number">{{ String(index + 1).padStart(2, '0') }}</span>{{ item.shortLabel }}</span></button>
    </div>
    <div id="manual-map-artifact" class="manual-map-artifact" aria-live="polite" aria-atomic="true"><div><p class="manual-map-stage-label">{{ stage.label }}</p><h3>{{ stage.title }}</h3><p>{{ stage.detail }}</p></div><div class="manual-map-deliverable"><span>Produced in this stage</span><strong data-testid="manual-map-artifact">{{ stage.artifact }}</strong><a class="manual-map-explore" :href="`#${stage.id}`">Explore this stage</a></div></div>
  </section>
</template>
