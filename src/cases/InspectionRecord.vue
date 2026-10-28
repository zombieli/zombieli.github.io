<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ASSETS, CHECKS, CHECK_LABELS, CONDITIONS, type InspectionPatch } from '../lib/inspection-core.mjs'
import { beginRecordWrite, completeRecordWrite, createRecordExample, editRecordExample, failRecordWrite, recordIsLocked, simulateOtherTab, type RecordWriteIntent } from '../lib/inspection-record'
import { useJourneyPlayback } from '../lib/journey-motion'
import './inspection-record.css'

const state = ref(createRecordExample())
const locked = computed(() => recordIsLocked(state.value))
const editorOpen = ref(true)
const selected = ref(0)
const { index: edge, pulse, version: animationKey, reduced: reducedMotion, stop: stopAnimation, select: trace } = useJourneyPlayback(() => 3)
const animatedEdge = computed(() => pulse.value ? edge.value : null)
const assetSelect = ref<HTMLSelectElement>()
const reopenButton = ref<HTMLButtonElement>()
const saveButton = ref<HTMLButtonElement>()
const resetButton = ref<HTMLButtonElement>()
const steps = [
  { id: 'draft', label: 'Draft', detail: 'A newly created draft is saved immediately in the real notebook. Later typing stays in the editor until Save draft or Submit record is chosen.' },
  { id: 'check', label: 'Check', detail: 'Submission requires one fictional asset, a condition and all three checklist items. A storage write also checks the saved timestamp: stale tabs cannot overwrite newer work.' },
  { id: 'pending', label: 'Pending', detail: 'The write uses a snapshot. Every editable control and Close stay locked while it is pending, preventing new typing from being lost when the write finishes.' },
  { id: 'committed', label: 'Committed', detail: 'Only transaction completion means saved. A saved draft unlocks; a submitted record stays read-only. A failed write preserves both the old saved record and unsaved input.' },
]
const phase = computed(() => state.value.pending ? 'Pending write' : state.value.base.status === 'submitted' ? 'Submitted · read-only' : state.value.outcome === 'rejected' ? 'Write rejected' : 'Draft · editable')
const completeCount = computed(() => CHECKS.filter(key => state.value.form.checks[key]).length)
const savedChecks = computed(() => CHECKS.filter(key => state.value.stored.checks[key]).length)
const stamp = (value: string) => value.slice(11)
function inspect(index: number) { stopAnimation(); selected.value = index }
function edit(patch: InspectionPatch) { state.value = editRecordExample(state.value, patch) }
function check(key: typeof CHECKS[number], event: Event) { edit({ checks: { ...state.value.form.checks, [key]: (event.target as HTMLInputElement).checked } }) }
function write(intent: RecordWriteIntent) {
  state.value = beginRecordWrite(state.value, intent)
  selected.value = state.value.pending ? 2 : 1
  trace(state.value.pending ? 1 : 0)
}
async function finish(success: boolean) {
  state.value = success ? completeRecordWrite(state.value) : failRecordWrite(state.value)
  selected.value = success ? 3 : 0
  if (success) trace(2)
  else stopAnimation()
  await nextTick()
  if (locked.value) resetButton.value?.focus()
  else saveButton.value?.focus()
}
function otherTab() { state.value = simulateOtherTab(state.value); selected.value = 1; stopAnimation() }
async function toggleEditor() {
  if (state.value.pending) return
  editorOpen.value = !editorOpen.value
  await nextTick()
  if (editorOpen.value) { if (locked.value) resetButton.value?.focus(); else assetSelect.value?.focus() }
  else reopenButton.value?.focus()
}
function reset() { stopAnimation(); state.value = createRecordExample(); selected.value = 0; editorOpen.value = true }
</script>

<template>
  <div class="inspection-record" data-testid="inspection-record-demo" :data-pending="String(!!state.pending)" :data-locked="String(locked)" :data-playing="String(animatedEdge !== null)">
    <div class="inspection-record-heading"><p>Interactive explanation · local record lifecycle</p><h3>When is an inspection actually saved?</h3><p>Fill a draft, start a write, then decide whether it completes or fails.</p></div>
    <ol class="inspection-record-track" aria-label="Record lifecycle">
      <li v-for="(step, index) in steps" :key="step.id" :class="{ 'is-selected': selected === index }">
        <span v-if="index < steps.length - 1" class="inspection-record-connector" aria-hidden="true"><span v-if="animatedEdge === index" :key="animationKey" class="inspection-record-packet" /></span>
        <button type="button" :data-record-step="step.id" :aria-current="selected === index ? 'step' : undefined" aria-controls="inspection-record-step-detail" @click="inspect(index)">
          <span class="inspection-record-icon" aria-hidden="true"><svg viewBox="0 0 40 40">
            <g v-if="step.id === 'draft'"><path d="M 9 4 H 24 L 31 11 V 35 H 9 Z M 24 4 V 11 H 31 M 14 17 H 25 M 14 23 H 25 M 14 29 H 21" /></g>
            <g v-else-if="step.id === 'check'"><rect x="6" y="5" width="28" height="30" rx="3" /><path d="M 11 13 L 14 16 L 19 10 M 11 25 L 14 28 L 19 22 M 24 14 H 29 M 24 26 H 29" /></g>
            <g v-else-if="step.id === 'pending'"><rect x="8" y="17" width="24" height="18" rx="3" /><path d="M 13 17 V 11 A 7 7 0 0 1 27 11 V 17 M 20 24 V 29" /></g>
            <g v-else><ellipse cx="20" cy="9" rx="13" ry="5" /><path d="M 7 9 V 29 C 7 36 33 36 33 29 V 9 M 13 22 L 18 27 L 27 18" /></g>
          </svg></span><strong>{{ step.label }}</strong>
        </button>
      </li>
    </ol>
    <div id="inspection-record-step-detail" class="inspection-record-detail" aria-live="polite"><span>Inspect {{ selected + 1 }} / 4 · {{ steps[selected].label }}</span><p>{{ steps[selected].detail }}</p></div>
    <div class="inspection-record-workspace">
      <div class="inspection-record-editor" :aria-busy="!!state.pending">
        <div class="inspection-record-panel-heading"><h4>Example editor</h4><span data-testid="inspection-record-state">{{ phase }}</span></div>
        <template v-if="editorOpen">
          <fieldset :disabled="locked"><legend class="inspection-record-sr-only">Inspection fields</legend>
            <label for="inspection-example-asset">Fictional asset</label><select id="inspection-example-asset" ref="assetSelect" :value="state.form.assetId" @change="edit({ assetId: ($event.target as HTMLSelectElement).value })"><option value="">Select an asset</option><option v-for="asset in ASSETS" :key="asset.id" :value="asset.id">{{ asset.id }} · {{ asset.name }}</option></select>
            <label for="inspection-example-condition">Condition</label><select id="inspection-example-condition" :value="state.form.condition" @change="edit({ condition: ($event.target as HTMLSelectElement).value as typeof state.form.condition })"><option value="">Select a condition</option><option v-for="(label, value) in CONDITIONS" :key="value" :value="value">{{ label }}</option></select>
            <div class="inspection-record-checks"><label v-for="key in CHECKS" :key="key"><input type="checkbox" :checked="state.form.checks[key]" @change="check(key, $event)" /><span>{{ CHECK_LABELS[key] }}</span></label></div>
            <label for="inspection-example-notes">Notes <span>(optional)</span></label><textarea id="inspection-example-notes" :value="state.form.notes" rows="3" maxlength="2000" @input="edit({ notes: ($event.target as HTMLTextAreaElement).value })" />
          </fieldset>
          <div class="inspection-record-form-meta"><span>{{ completeCount }} / 3 checks</span><span>{{ state.form.notes.length }} / 2,000</span></div>
          <div class="inspection-record-actions"><button ref="saveButton" type="button" :disabled="locked" @click="write('save')">Save draft</button><button type="button" class="inspection-record-primary" :disabled="locked" @click="write('submit')">Submit record</button><button type="button" :disabled="!!state.pending" @click="toggleEditor">Close editor</button></div>
        </template>
        <div v-else class="inspection-record-closed"><p>The editor is closed. This example keeps its unsaved input.</p><button ref="reopenButton" type="button" @click="toggleEditor">Reopen editor</button></div>
      </div>
      <div class="inspection-record-ledger" data-testid="inspection-record-saved"><div class="inspection-record-panel-heading"><h4>Saved record</h4><span>Example memory only</span></div><dl><div><dt>Status</dt><dd data-record-saved-status>{{ state.stored.status }}</dd></div><div><dt>Asset</dt><dd>{{ state.stored.assetId || 'Not selected' }}</dd></div><div><dt>Condition</dt><dd>{{ state.stored.condition ? CONDITIONS[state.stored.condition] : 'Not selected' }}</dd></div><div><dt>Checks</dt><dd>{{ savedChecks }} / 3</dd></div><div><dt>Updated · UTC</dt><dd><code data-record-saved-timestamp>{{ stamp(state.stored.updatedAt) }}</code></dd></div></dl><p class="inspection-record-saved-note"><strong>Saved notes</strong><span>{{ state.stored.notes || 'No notes saved.' }}</span></p><div v-if="state.pending" class="inspection-record-snapshot" data-testid="inspection-record-snapshot"><strong>Snapshot awaiting completion</strong><span>{{ state.pending.candidate.status }} · {{ state.pending.candidate.assetId || 'no asset' }}</span><code>{{ stamp(state.pending.candidate.updatedAt) }}</code></div><p v-else class="inspection-record-ledger-note">No pending write. Editing alone does not change this saved record.</p></div>
    </div>
    <div v-if="state.pending" class="inspection-record-pending-controls"><span>Hold the write here. Choose its outcome:</span><button type="button" class="inspection-record-primary" @click="finish(true)">Complete write</button><button type="button" @click="finish(false)">Fail write</button></div>
    <p class="inspection-record-message" :class="{ 'is-rejected': state.outcome === 'rejected' }" data-testid="inspection-record-message" role="status">{{ state.message }}</p>
    <div class="inspection-record-scenarios"><button type="button" :disabled="locked" @click="otherTab">Simulate another tab</button><button ref="resetButton" type="button" @click="reset">Reset example</button></div>
    <p class="inspection-record-note">{{ reducedMotion ? 'Reduced motion is on. ' : '' }}Click the diagram nodes to inspect each boundary. This in-memory example uses the notebook’s original validation functions and models its storage checks; it never opens IndexedDB. The clock is deliberately fixed: each edit advances the timestamp by at least 1 ms, even if the clock has not moved. The real notebook does not ask you to complete writes manually.</p>
  </div>
</template>
