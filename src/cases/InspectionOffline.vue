<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import './inspection-offline.css'

const modes = [
  { id: 'first', label: 'First visit offline', shell: false, storage: false, result: 'No cached shell. The notebook cannot open.', detail: 'This fresh browser has never loaded the demo online. No worker has prepared its files, so an offline request cannot start the application.' },
  { id: 'ready', label: 'Prepared offline', shell: true, storage: true, result: 'Cached shell + local records. Ready to continue.', detail: 'A previous online visit finished precaching and the active worker controls this demo. The shell loads from its cache; the application reads records from IndexedDB.' },
  { id: 'unavailable', label: 'Storage unavailable', shell: true, storage: false, result: 'The page opens. Record actions stay unavailable.', detail: 'The cached shell can still render when IndexedDB is unavailable. The real interface reports the storage error instead of pretending that a record was saved.' },
] as const
const nodes = [
  { title: 'Open the notebook', kind: 'Offline request', path: 'M8 10h48v36H8z M8 18h48 M15 14h1m5 0h1 M20 54h24 M32 46v8 M22 29q10-9 20 0 M26 34q6-5 12 0 M32 39h.01' },
  { title: 'Cached application', kind: 'Service worker cache', path: 'M12 9h30l10 10v36H12z M42 9v12h10 M21 29h22 M21 37h22 M21 45h14' },
  { title: 'Local inspections', kind: 'IndexedDB records', path: 'M12 17c0-9 40-9 40 0s-40 9-40 0v30c0 9 40 9 40 0V17 M12 32c0 9 40 9 40 0 M23 40l5 5 13-13' },
] as const
const modeId = ref<(typeof modes)[number]['id']>('ready')
const active = computed(() => modes.find(item => item.id === modeId.value)!)
const { index: selected, playing, reduced, stop, replay } = useJourneyPlayback(() => active.value.shell ? 3 : 2)
const explanations = computed(() => [
  'This case-page diagram simulates an offline visit. It does not change your connection or register a service worker.',
  active.value.shell ? 'The worker returns its own cached HTML, CSS, JavaScript, manifest and icons. It only handles same-origin GET requests inside the demo directory.' : 'There is no prepared cache in this first-visit example. An offline navigation has no application shell to load.',
  active.value.storage ? 'The application reads inspection records from IndexedDB. A cached page is not a backup of these records; exported JSON is a separate copy.' : modeId.value === 'first' ? 'The application has not loaded, so it cannot read or edit records. Visit online first to prepare offline access.' : 'IndexedDB is unavailable in this scenario. Cached files remain separate, and the interface reports the storage error.',
])
function inspect(index: number) { stop(); selected.value = index }
function changeMode(id: (typeof modes)[number]['id']) { stop(); modeId.value = id; selected.value = 0 }
</script>

<template>
  <div class="inspection-offline" data-testid="inspection-offline" :data-playing="playing" :data-mode="modeId">
    <div class="inspection-offline-heading"><div><p class="eyebrow">Interactive system map</p><h3>Two stores. Different jobs.</h3></div><span class="inspection-offline-tag">In-memory illustration</span></div>
    <div class="inspection-offline-modes" role="group" aria-label="Offline scenario"><button v-for="mode in modes" :key="mode.id" type="button" :aria-pressed="modeId === mode.id" :data-offline-mode="mode.id" @click="changeMode(mode.id)">{{ mode.label }}</button></div>
    <div class="inspection-offline-board">
      <button v-for="(node, index) in nodes" :key="node.title" type="button" class="inspection-offline-node" :class="{ selected: selected === index, blocked: index === 1 && !active.shell || index === 2 && !active.storage, tracing: playing && selected === index }" :aria-pressed="selected === index" :data-offline-node="index" @click="inspect(index)">
        <span class="inspection-offline-number">0{{ index + 1 }}</span><svg viewBox="0 0 64 64" aria-hidden="true"><path :d="node.path" /></svg><strong>{{ node.title }}</strong><span>{{ node.kind }}</span><small>{{ index === 0 ? 'Network disconnected' : index === 1 ? active.shell ? 'Prepared on a prior online visit' : 'No cached files yet' : active.storage ? 'Records available locally' : modeId === 'first' ? 'Application cannot start' : 'Database access failed' }}</small>
      </button>
    </div>
    <div class="inspection-offline-inspector" :aria-live="playing ? 'off' : 'polite'"><strong>{{ nodes[selected]!.kind }}</strong><p>{{ explanations[selected] }}</p></div>
    <div class="inspection-offline-result" data-testid="inspection-offline-result"><strong>{{ active.result }}</strong><p>{{ active.detail }}</p></div>
    <div class="inspection-offline-footer"><button class="button secondary" type="button" @click="playing ? stop() : replay()">{{ playing ? 'Pause path' : 'Replay offline path' }}</button><span>{{ reduced ? 'Reduced motion: select any node to inspect.' : 'Select a scenario or click a node to inspect its role.' }}</span></div>
  </div>
</template>
