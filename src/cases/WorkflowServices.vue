<script setup lang="ts">
import { ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import './workflow-services.css'

const mode = ref<'demo' | 'api'>('demo')
const { pulse: activated, version: selectionVersion, highlight } = useJourneyPlayback(() => 1, 0, 1300)

function selectMode(next: 'demo' | 'api') {
  mode.value = next
  highlight()
}
</script>

<template>
  <div class="workflow-services" data-testid="workflow-services">
    <div class="workflow-services-contract">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M 7 3 H 21 L 26 8 V 29 H 7 Z M 21 3 V 8 H 26 M 12 14 H 21 M 12 20 H 21 M 12 25 H 18" /></svg>
      <div><strong>One shared contract</strong><span>contract.json defines assets, priorities, statuses and legal transitions.</span></div>
    </div>
    <div class="workflow-services-selector" role="group" aria-label="Explore service mode">
      <button type="button" :aria-pressed="mode === 'demo'" aria-controls="workflow-service-mode-detail" @click="selectMode('demo')">Browser demo</button>
      <button type="button" :aria-pressed="mode === 'api'" aria-controls="workflow-service-mode-detail" @click="selectMode('api')">Local API</button>
    </div>
    <ol class="workflow-services-route" aria-label="Selected service architecture">
      <li class="workflow-services-node">
        <svg viewBox="0 0 64 56" aria-hidden="true"><rect x="7" y="5" width="50" height="36" rx="3" /><path d="M 7 15 H 57 M 13 10 H 14 M 19 10 H 20 M 27 41 V 50 M 37 41 V 50 M 21 50 H 43 M 16 23 H 30 M 16 30 H 44" /></svg>
        <strong>Vue interface</strong><span>Forms, next steps and history</span>
        <span class="workflow-services-edge" aria-hidden="true"><span v-if="activated" :key="`interface-${selectionVersion}`" class="workflow-services-packet" /></span>
      </li>
      <li class="workflow-services-node">
        <svg viewBox="0 0 64 56" aria-hidden="true"><rect x="19" y="7" width="26" height="42" rx="3" /><path d="M 5 18 H 19 M 5 38 H 19 M 45 18 H 59 M 45 38 H 59 M 26 18 H 38 M 26 28 H 38 M 26 38 H 38" /></svg>
        <strong>Service interface</strong><span>List, create, inspect and change</span>
        <span class="workflow-services-edge" aria-hidden="true"><span v-if="activated" :key="`service-${selectionVersion}`" class="workflow-services-packet workflow-services-packet-later" /></span>
      </li>
      <li class="workflow-services-node is-selected">
        <svg v-if="mode === 'demo'" viewBox="0 0 64 56" aria-hidden="true"><rect x="8" y="7" width="48" height="42" rx="3" /><path d="M 8 18 H 56 M 14 12 H 15 M 20 12 H 21 M 27 26 L 21 32 L 27 38 M 37 26 L 43 32 L 37 38 M 33 25 L 30 40" /></svg>
        <svg v-else viewBox="0 0 64 56" aria-hidden="true"><rect x="4" y="8" width="22" height="35" rx="3" /><path d="M 10 17 H 20 M 10 25 H 20 M 10 35 H 13 M 26 26 H 36 M 32 22 L 36 26 L 32 30" /><ellipse cx="47" cy="15" rx="11" ry="5" /><path d="M 36 15 V 41 C 36 48 58 48 58 41 V 15 M 36 28 C 36 35 58 35 58 28" /></svg>
        <strong>{{ mode === 'demo' ? 'In-memory service' : 'FastAPI + SQLite' }}</strong><span>{{ mode === 'demo' ? 'Synthetic records in this tab' : 'Local API and database file' }}</span>
      </li>
    </ol>
    <div id="workflow-service-mode-detail" class="workflow-services-detail" data-testid="service-mode-detail" aria-live="polite">
      <template v-if="mode === 'demo'"><h3>Session-only browser demo</h3><p>The in-memory service keeps synthetic records in the current tab. A refresh resets the demo; it sends no data to the API and provides no persistent storage.</p><a class="text-link" href="/field-service-workflow/">Open browser demo</a></template>
      <template v-else><h3>Local API with SQLite persistence</h3><p>The API service sends requests to FastAPI. SQLite keeps records across application restarts; version checks and transactions protect accepted changes. Run this mode from the source bundle.</p><a class="text-link" href="/downloads/field-service-workflow.zip" download>Download API source</a></template>
    </div>
    <p class="workflow-services-note">Selecting a route explains the source architecture. It does not switch the running demo or make an API request.</p>
  </div>
</template>
