<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import { applyLifecycleChange, createLifecycleExample, lifecycleStatuses, lifecycleTransitions, type LifecycleStatus } from '../lib/workflow-lifecycle'
import './workflow-lifecycle.css'

const order = ref(createLifecycleExample())
const inspected = ref<LifecycleStatus>('Open')
const target = ref<LifecycleStatus>('Assigned')
const assignee = ref('')
const resolution = ref('')
const feedback = ref('')
const error = ref(false)
const board = ref<HTMLElement | null>(null)
const edges = ref<{ id: string; path: string }[]>([])
const lastEdge = ref('')
const { pulse, version: animationVersion, stop: clearAnimation, highlight } = useJourneyPlayback(() => 1)
const activeEdge = computed(() => pulse.value ? lastEdge.value : '')
const choices = computed(() => lifecycleTransitions[order.value.status])
const rules: Record<LifecycleStatus, string> = {
  Open: 'A reported fault starts here. Assignment requires a technician label before the order can move forward.',
  Assigned: 'The technician label is recorded. Starting work keeps that assignment and adds a new history event.',
  'In Progress': 'Work has started. A treatment note is required before this order can be resolved.',
  Resolved: 'Close the finished record, or reopen it. Reopening clears the current assignment and treatment note while keeping earlier history.',
  Closed: 'This is the terminal state. The contract has no outgoing transition from Closed.',
}
let observer: ResizeObserver | undefined
let frame: number | undefined

function measure() {
  if (frame !== undefined) window.cancelAnimationFrame(frame)
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    if (!board.value) return
    const bounds = board.value.getBoundingClientRect()
    const nodes = [...board.value.querySelectorAll<HTMLElement>('.lifecycle-symbol')].map(node => {
      const rect = node.getBoundingClientRect()
      const button = node.closest('button')!.getBoundingClientRect()
      return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2, r: rect.width / 2, bottom: button.bottom - bounds.top }
    })
    if (nodes.length !== 5) return
    const vertical = Math.abs(nodes[0].y - nodes[1].y) > 5
    const paths = nodes.slice(0, -1).map((from, i) => {
      const to = nodes[i + 1]
      return { id: `${lifecycleStatuses[i]}-${lifecycleStatuses[i + 1]}`, path: vertical
        ? `M ${from.x} ${from.y + from.r + 4} L ${to.x} ${to.y - to.r - 7}`
        : `M ${from.x + from.r + 4} ${from.y} L ${to.x - to.r - 7} ${to.y}` }
    })
    const from = nodes[3], to = nodes[0]
    paths.push({ id: 'Resolved-Open', path: vertical
      ? `M ${from.x - from.r - 4} ${from.y} H 8 V ${to.y} H ${to.x - to.r - 7}`
      : `M ${from.x} ${from.bottom + 4} V ${bounds.height - 15} H ${to.x} V ${to.bottom + 7}` })
    edges.value = paths
  })
}

function applyChange() {
  clearAnimation()
  const previous = order.value.status
  const result = applyLifecycleChange(order.value, target.value, { assignee: assignee.value, resolution: resolution.value })
  error.value = !result.ok
  if (!result.ok) { feedback.value = result.message; return }
  const destination = result.state.status
  order.value = result.state
  inspected.value = destination
  feedback.value = destination === 'Open'
    ? 'Reopened. Current assignment and treatment note cleared; earlier history retained.'
    : `${previous} → ${destination}. Record version and history advanced together.`
  assignee.value = ''
  resolution.value = ''
  target.value = lifecycleTransitions[destination][0] || destination
  lastEdge.value = `${previous}-${destination}`
  highlight()
}

function reset() {
  clearAnimation()
  order.value = createLifecycleExample()
  inspected.value = 'Open'
  target.value = 'Assigned'
  assignee.value = ''
  resolution.value = ''
  error.value = false
  feedback.value = 'Example reset to a new Open order.'
}

onMounted(() => {
  observer = new ResizeObserver(measure)
  if (board.value) observer.observe(board.value)
  measure()
})
onUnmounted(() => {
  clearAnimation()
  observer?.disconnect()
  if (frame !== undefined) window.cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="workflow-lifecycle" data-testid="workflow-lifecycle">
    <div class="lifecycle-heading"><div><p>Interactive explanation · synthetic example</p><h3>One order. Five states. Clear gates.</h3></div><button type="button" class="lifecycle-reset" @click="reset">Reset example</button></div>
    <div ref="board" class="lifecycle-board" role="group" aria-label="Inspect a work-order state">
      <svg class="lifecycle-connections" aria-hidden="true">
        <defs><marker id="lifecycle-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M 1 1 L 7 4 L 1 7" fill="none" stroke="currentColor" stroke-width="1.5" /></marker></defs>
        <path v-for="edge in edges" :key="edge.id" :d="edge.path" :class="['lifecycle-edge', { 'is-return': edge.id === 'Resolved-Open' }]" marker-end="url(#lifecycle-arrow)" />
        <path v-if="activeEdge" :key="animationVersion" :d="edges.find(edge => edge.id === activeEdge)?.path" pathLength="1" class="lifecycle-trace" marker-end="url(#lifecycle-arrow)" />
      </svg>
      <button v-for="(state, index) in lifecycleStatuses" :key="state" type="button" class="lifecycle-node" :class="{ 'is-current': order.status === state, 'is-inspected': inspected === state }" :data-state="state" :aria-pressed="inspected === state" aria-controls="lifecycle-state-detail" @click="inspected = state">
        <span class="lifecycle-symbol" aria-hidden="true"><svg viewBox="0 0 40 40">
          <g v-if="index === 0"><rect x="10" y="8" width="20" height="27" rx="2" /><path d="M 15 8 V 5 H 25 V 8 M 15 17 H 25 M 15 23 H 25 M 15 29 H 21" /></g>
          <g v-else-if="index === 1"><circle cx="20" cy="12" r="6" /><path d="M 8 34 V 29 C 8 17 32 17 32 29 V 34 M 14 34 V 28 M 26 34 V 28" /></g>
          <g v-else-if="index === 2"><path d="M 28 6 L 22 12 L 28 18 L 34 12 C 36 21 31 25 23 23 L 11 35 L 5 29 L 17 17 C 15 9 20 4 28 6 Z" /></g>
          <g v-else-if="index === 3"><path d="M 10 8 H 30 V 33 H 10 Z M 15 8 V 5 H 25 V 8 M 14 22 L 18 26 L 27 17" /></g>
          <g v-else><path d="M 20 5 L 33 10 V 20 C 33 28 26 33 20 36 C 14 33 7 28 7 20 V 10 Z M 13 20 L 18 25 L 27 16" /></g>
        </svg></span>
        <span class="lifecycle-node-text"><strong>{{ state }}</strong><span>{{ order.status === state ? 'Current state' : state === 'Closed' ? 'Terminal' : 'Inspect rule' }}</span></span>
      </button>
    </div>
    <p class="lifecycle-return">Return path: <strong>Resolved → Open</strong>. Closed has no outgoing path.</p>
    <div id="lifecycle-state-detail" class="lifecycle-rule" aria-live="polite"><strong>{{ inspected }}</strong><p>{{ rules[inspected] }}</p></div>
    <div class="lifecycle-workspace">
      <form class="lifecycle-form" novalidate @submit.prevent="applyChange">
        <h4>Try a change</h4>
        <p class="lifecycle-available">Allowed from {{ order.status }}: {{ choices.length ? choices.join(' or ') : 'none' }}.</p>
        <label for="lifecycle-target">Next status</label>
        <select id="lifecycle-target" v-model="target" :disabled="order.status === 'Closed'"><option v-for="state in lifecycleStatuses" :key="state" :value="state">{{ state }}</option></select>
        <template v-if="target === 'Assigned'"><label for="lifecycle-assignee">Technician label</label><input id="lifecycle-assignee" v-model="assignee" type="text" maxlength="80" placeholder="e.g. Demo Alex" autocomplete="off" /></template>
        <template v-if="target === 'Resolved'"><label for="lifecycle-resolution">Treatment note</label><textarea id="lifecycle-resolution" v-model="resolution" maxlength="2000" rows="3" placeholder="Describe the synthetic treatment" /></template>
        <button type="submit" class="button primary" :disabled="order.status === 'Closed'">Apply change</button>
        <p v-if="feedback" class="lifecycle-feedback" :class="{ 'is-error': error }" role="status">{{ feedback }}</p>
      </form>
      <div class="lifecycle-record">
        <h4>Current example</h4>
        <dl><div><dt>Status</dt><dd data-current-status>{{ order.status }}</dd></div><div><dt>Version</dt><dd data-order-version>{{ order.version }}</dd></div><div><dt>Technician</dt><dd data-current-assignee>{{ order.assignee || 'Not assigned' }}</dd></div><div><dt>Treatment</dt><dd data-current-resolution>{{ order.resolution || 'No current note' }}</dd></div></dl>
        <details class="lifecycle-history" open><summary>Retained history · <span data-history-count>{{ order.history.length }}</span> events</summary><ol><li v-for="event in order.history" :key="event.version"><span>v{{ event.version }}</span><div><strong>{{ event.to }}</strong><p>{{ event.note }}</p></div></li></ol></details>
      </div>
    </div>
    <p class="lifecycle-note">State rules come from the shared project contract. This example stays on this page and resets on reload. Selecting a diagram node inspects a rule; only Apply change changes the order.</p>
  </div>
</template>
