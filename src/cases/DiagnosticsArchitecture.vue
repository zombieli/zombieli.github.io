<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import './diagnostics-architecture.css'

type NodeId = 'simulator' | 'transport' | 'validation' | 'runner' | 'reporting'
type PositionId = NodeId | 'configuration'
type Port = 'top' | 'bottom' | 'left' | 'right'
const nodes: { id: NodeId; label: string; accessible: string; caption: string; file: string; detail: string }[] = [
  { id: 'runner', label: 'Runner', accessible: 'Inspect runner', caption: 'Attempts + expectations', file: 'runner.py', detail: 'Builds each request, retries transport failures within a finite limit and validates received responses. Records attempts and compares the observed diagnostic with the case expectation.' },
  { id: 'transport', label: 'TCP adapter', accessible: 'Inspect TCP adapter', caption: 'Request ↔ response', file: 'transport.py', detail: 'Opens a new TCP connection for each attempt, applies the deadline and reads a bounded newline-delimited frame. Uses protocol.py to encode and decode JSON frames.' },
  { id: 'simulator', label: 'Local simulator', accessible: 'Inspect simulator', caption: '11 repeatable scenarios', file: 'simulator.py', detail: 'Serves synthetic readings and deliberate faults over local TCP. Isolates recovery state by run and case so one execution cannot change the next.' },
  { id: 'validation', label: 'Response validation', accessible: 'Inspect response validation', caption: 'Check received data', file: 'protocol.py', detail: 'Checks protocol and request identity, required fields, types and lab ranges after the runner receives a decoded response. Returns validated data or a diagnostic error.' },
  { id: 'reporting', label: 'Reporting', accessible: 'Inspect reporting', caption: 'JSON · CSV · event logs', file: 'reporting.py', detail: 'Writes the completed run to report.json, cases.csv and events.jsonl in a staging directory. Renames that directory only when the full report set is ready.' },
]
const edges: { id: string; from: PositionId; to: PositionId; both?: boolean }[] = [
  { id: 'configuration-runner', from: 'configuration', to: 'runner' },
  { id: 'runner-transport', from: 'runner', to: 'transport', both: true },
  { id: 'transport-simulator', from: 'transport', to: 'simulator', both: true },
  { id: 'runner-validation', from: 'runner', to: 'validation', both: true },
  { id: 'runner-reporting', from: 'runner', to: 'reporting' },
]
const selected = ref<NodeId>('runner')
const selectedNode = computed(() => nodes.find(node => node.id === selected.value)!)
const graph = ref<HTMLElement>()
const paths = ref<Record<string, string>>({})
const graphSize = ref({ width: 1, height: 1 })
const { pulse: animating, version: trace, highlight } = useJourneyPlayback(() => 1)
const id = useId()
const detailId = `${id}-architecture-detail`
let observer: ResizeObserver | undefined

function connected(edge: typeof edges[number]) {
  return edge.from === selected.value || edge.to === selected.value
}

function selectNode(node: NodeId) { selected.value = node; highlight() }

function measureGraph() {
  if (!graph.value) return
  const bounds = graph.value.getBoundingClientRect()
  graphSize.value = { width: bounds.width, height: bounds.height }
  const narrow = bounds.width < 570
  const port = (node: PositionId, side: Port, offset = 0) => {
    const rect = graph.value!.querySelector<HTMLElement>(`[data-architecture-node="${node}"]`)!.getBoundingClientRect()
    const x = rect.left - bounds.left
    const y = rect.top - bounds.top
    if (side === 'top') return { x: x + rect.width / 2 + offset, y: y - 7 }
    if (side === 'bottom') return { x: x + rect.width / 2 + offset, y: y + rect.height + 7 }
    if (side === 'left') return { x: x - 7, y: y + rect.height / 2 }
    return { x: x + rect.width + 7, y: y + rect.height / 2 }
  }
  const line = (from: PositionId, start: Port, to: PositionId, end: Port) => {
    const a = port(from, start)
    const b = port(to, end)
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  }
  let reporting = line('runner', 'bottom', 'reporting', 'top')
  if (narrow) {
    const a = port('runner', 'bottom', 28)
    const b = port('reporting', 'top', -28)
    const middle = (a.y + b.y) / 2
    reporting = `M ${a.x} ${a.y} V ${middle} H ${b.x} V ${b.y}`
  }
  paths.value = {
    'configuration-runner': line('configuration', 'bottom', 'runner', 'top'),
    'runner-transport': narrow ? line('runner', 'bottom', 'transport', 'top') : line('runner', 'right', 'transport', 'left'),
    'transport-simulator': line('transport', 'bottom', 'simulator', 'top'),
    'runner-validation': narrow ? line('runner', 'right', 'validation', 'left') : line('runner', 'left', 'validation', 'right'),
    'runner-reporting': reporting,
  }
}

onMounted(() => {
  observer = new ResizeObserver(measureGraph)
  if (graph.value) observer.observe(graph.value)
  measureGraph()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="architecture-map" data-testid="architecture-map" :data-animating="animating">
    <div ref="graph" class="architecture-graph" aria-label="Diagnostic module relationships">
      <svg class="architecture-wires" :viewBox="`0 0 ${graphSize.width} ${graphSize.height}`" aria-hidden="true">
        <defs>
          <marker v-for="tone in ['idle', 'active']" :id="`${id}-arrow-${tone}`" :key="tone" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 1 1 L 6 4 L 1 7" fill="none" :stroke="tone === 'active' ? 'var(--blue)' : 'var(--muted)'" stroke-width="1.5" />
          </marker>
        </defs>
        <g v-for="edge in edges" :key="edge.id" :class="['architecture-edge', { 'is-connected': connected(edge) }]">
          <path :d="paths[edge.id]" :marker-start="edge.both ? `url(#${id}-arrow-${connected(edge) ? 'active' : 'idle'})` : undefined" :marker-end="`url(#${id}-arrow-${connected(edge) ? 'active' : 'idle'})`" />
          <path v-if="animating && connected(edge)" :key="trace" class="architecture-signal" :d="paths[edge.id]" pathLength="1" />
        </g>
      </svg>

      <div class="architecture-configuration" data-architecture-node="configuration">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 8h22M5 16h22M5 24h22M11 5v6M22 13v6M14 21v6" /></svg>
        <span><strong>Configuration</strong><small>Cases, limits + expectations</small></span>
      </div>

      <button v-for="node in nodes" :key="node.id" type="button" :class="['architecture-node', `architecture-${node.id}`]" :data-architecture-node="node.id" :aria-label="node.accessible" :aria-pressed="selected === node.id" :aria-controls="detailId" @click="selectNode(node.id)">
        <svg class="architecture-icon" viewBox="0 0 48 40" aria-hidden="true">
          <g v-if="node.id === 'runner'"><rect x="5" y="5" width="38" height="30" rx="3" /><path d="m17 13 12 7-12 7Z" /><path d="M34 14h3M34 20h3M34 26h3" /></g>
          <g v-else-if="node.id === 'transport'"><rect x="13" y="9" width="22" height="22" rx="3" /><path d="M20 9V4M28 9V4M20 31v5M28 31v5M13 16H5M13 24H5M35 16h8M35 24h8M20 20h8m-3-3 3 3-3 3" /></g>
          <g v-else-if="node.id === 'simulator'"><rect x="5" y="4" width="38" height="27" rx="3" /><path d="M19 31v5h10v-5M13 36h22M11 19h6l4-8 6 13 4-7h6" /></g>
          <g v-else-if="node.id === 'validation'"><path d="m24 3 15 6v11c0 8-9 14-15 17C18 34 9 28 9 20V9Z" /><path d="m16 20 6 6 11-12" /></g>
          <g v-else><path d="M12 8H7v27h25v-4M16 3h16l9 9v19H16ZM32 3v9h9M22 18h12M22 23h12" /></g>
        </svg>
        <strong>{{ node.label }}</strong>
        <span>{{ node.caption }}</span>
      </button>
    </div>

    <div :id="detailId" class="architecture-detail" aria-live="polite" aria-atomic="true">
      <div><strong>{{ selectedNode.label }}</strong><code>{{ selectedNode.file }}</code></div>
      <p>{{ selectedNode.detail }}</p>
    </div>
    <p class="architecture-caption">Select a module to trace its connections. Validation checks the received response; reporting saves the completed run.</p>
  </div>
</template>
