<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJourneyPlayback } from '../lib/journey-motion'
import { getInspectionImportScenario, inspectionImportOptions, type InspectionImportKey, type InspectionImportStage } from '../lib/inspection-import'
import './inspection-import.css'

const selected = ref<InspectionImportKey>('clean')
const { index, playing, pulse, reduced: reducedMotion, stop: pause, select, replay } = useJourneyPlayback(() => scenario.value.frames.length)
const scenario = computed(() => getInspectionImportScenario(selected.value))
const current = computed(() => scenario.value.frames[index.value]!)
const stages: { id: InspectionImportStage; label: string; caption: string }[] = [
  { id: 'file', label: 'Backup file', caption: 'Schema v1' },
  { id: 'validate', label: 'Validate', caption: 'Before storage' },
  { id: 'transaction', label: 'Open transaction', caption: 'Check capacity' },
  { id: 'write', label: 'Queue adds', caption: 'All still pending' },
  { id: 'finish', label: 'Commit or abort', caption: 'One outcome' },
]
function choose(key: InspectionImportKey) { pause(); selected.value = key; index.value = 0 }
function step(delta: number) { select(index.value + delta) }
function stageIndex(stage: InspectionImportStage) { return scenario.value.frames.findIndex(frame => frame.stage === stage) }
function inspect(stage: InspectionImportStage) { const next = stageIndex(stage); if (next >= 0) select(next) }
</script>

<template>
  <div class="inspection-import" data-testid="inspection-import-demo" :data-playing="String(playing)" :data-animating="pulse">
    <div class="inspection-import-heading"><p>Interactive backup recovery</p><h3>Every record, or none of them.</h3></div>
    <p class="inspection-import-intro">Follow a backup through validation and one atomic transaction. Choose a failure to see exactly what stays in the notebook.</p>
    <div class="inspection-import-scenarios" role="group" aria-label="Backup import scenario"><button v-for="option in inspectionImportOptions" :key="option.id" type="button" :aria-pressed="selected === option.id" @click="choose(option.id)">{{ option.label }}</button></div>
    <div class="inspection-import-diagram" :class="{ 'is-playing': playing }" role="group" aria-label="Inspect import stages">
      <button v-for="(stage, position) in stages" :key="stage.id" type="button" class="inspection-import-node" :class="{ 'is-active': current.stage === stage.id, 'is-past': stageIndex(stage.id) >= 0 && stageIndex(stage.id) < index, 'is-failed': current.stage === stage.id && current.error }" :aria-pressed="current.stage === stage.id" :aria-label="`Inspect ${stage.label}`" :disabled="stageIndex(stage.id) < 0" @click="inspect(stage.id)">
        <span class="inspection-import-node-number">0{{ position + 1 }}</span>
        <svg :key="current.stage === stage.id ? current.id : stage.id" viewBox="0 0 64 48" aria-hidden="true">
          <g v-if="stage.id === 'file'"><path d="M19 5h19l8 8v29H19zM38 5v9h8M25 22h15M25 28h15M25 34h9" /><path class="inspection-import-fill" d="M14 11v32h26" /></g>
          <g v-else-if="stage.id === 'validate'"><path d="M13 10h22M13 24h22M13 38h22M43 9l4 4 6-8M43 23l4 4 6-8M43 37l4 4 6-8" /></g>
          <g v-else-if="stage.id === 'transaction'"><ellipse cx="32" cy="10" rx="20" ry="7" /><path d="M12 10v25c0 9 40 9 40 0V10M12 22c0 9 40 9 40 0" /><path class="inspection-import-fill" d="M22 30h20" /></g>
          <g v-else-if="stage.id === 'write'"><rect x="7" y="9" width="15" height="30" rx="2" /><rect x="25" y="9" width="15" height="30" rx="2" /><rect x="43" y="9" width="15" height="30" rx="2" /><path d="M11 17h7M29 17h7M47 17h7M11 23h7M29 23h7M47 23h7" /></g>
          <g v-else><path d="M9 24h14l8-12h21M23 24l8 12h21M40 7l5 5-5 5M40 31l10 10M50 31L40 41" /></g>
        </svg>
        <strong>{{ stage.label }}</strong><span>{{ stage.caption }}</span>
      </button>
    </div>
    <div class="inspection-import-controls"><button type="button" @click="playing ? pause() : replay()">{{ playing ? 'Pause import' : 'Replay import' }}</button><button type="button" :disabled="index === 0" @click="step(-1)">Previous step</button><button type="button" :disabled="index === scenario.frames.length - 1" @click="step(1)">Next step</button><span data-testid="inspection-import-step">{{ index + 1 }} / {{ scenario.frames.length }}</span></div>
    <div class="inspection-import-detail" :class="{ 'has-error': current.error }" :aria-live="playing ? 'off' : 'polite'" aria-atomic="true">
      <p class="inspection-import-position">{{ current.transaction ? 'Transaction open · no success yet' : current.outcome === 'waiting' ? 'No transaction is open' : 'Final outcome' }}</p>
      <h4>{{ current.title }}</h4><p>{{ current.detail }}</p><p v-if="current.error" class="inspection-import-error">{{ current.error }}</p>
    </div>
    <div class="inspection-import-storage" :class="{ 'is-playing': playing }">
      <div class="inspection-import-store inspection-import-incoming"><div class="inspection-import-store-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5zM15 3v5h4M9 12h6M9 16h6" /></svg><h4>Incoming file</h4></div><div class="inspection-import-ids"><span v-for="id in scenario.incoming" :key="id" :class="{ 'is-conflict': selected === 'conflict' && id === 'saved-001' }">{{ id }}</span></div><p>{{ selected === 'invalid' ? 'condition: ["acceptable"]' : `${scenario.incoming.length} record${scenario.incoming.length === 1 ? '' : 's'} · schema v1` }}</p></div>
      <div class="inspection-import-store inspection-import-pending" data-testid="inspection-import-pending"><div class="inspection-import-store-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14M5 21h14M7 3v5l5 4-5 4v5M17 3v5l-5 4 5 4v5" /></svg><h4>Pending adds</h4></div><div class="inspection-import-ids"><span v-for="id in current.pending" :key="id">{{ id }}</span><em v-if="!current.pending.length">None</em></div><p>Visible here for explanation; not committed.</p></div>
      <div class="inspection-import-store inspection-import-committed" data-testid="inspection-import-committed" :data-count="current.committed.length"><div class="inspection-import-store-title"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v13c0 4 16 4 16 0V5M4 11c0 4 16 4 16 0" /></svg><h4>Saved notebook</h4></div><div class="inspection-import-ids"><span v-for="id in current.committed.slice(0, 3)" :key="id" :class="{ 'is-new': id.startsWith('new-') }">{{ id }}</span><em v-if="current.committed.length > 3">+ {{ current.committed.length - 3 }} more</em></div><p><strong>{{ current.committed.length }}</strong> committed {{ current.committed.length === 1 ? 'record' : 'records' }}</p></div>
    </div>
    <p class="inspection-import-result" data-testid="inspection-import-result" :data-outcome="current.outcome">{{ current.outcome === 'committed' ? 'All incoming records are saved together.' : current.outcome === 'aborted' || current.outcome === 'rejected' ? 'Nothing imported. The original notebook is unchanged.' : 'The original notebook is unchanged so far.' }}</p>
    <p class="inspection-import-note">{{ reducedMotion ? 'Reduced motion is on; use the stage buttons or step controls. ' : 'Replay uses an illustrative pace. ' }}Synthetic records stay in memory on this page. Validation runs the project’s original core; the transaction diagram illustrates storage behavior without accessing your notebook.</p>
  </div>
</template>
