<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { readDiagnosticsReport } from '../lib/diagnostics-report'
import type { DiagnosticReport } from '../lib/diagnostics-report'

const emit = defineEmits<{ ready: [] }>()
const report = ref<DiagnosticReport | null>(null)
const loading = ref(true)
const error = ref('')
const selected = ref('normal')
const result = computed(() => report.value?.cases.find(item => item.scenario === selected.value))
const labels: Record<string, string> = {
  normal: 'Healthy response', timeout: 'Response timeout', disconnect: 'Peer disconnect',
  malformed: 'Malformed JSON', missing_field: 'Missing status field', wrong_type: 'Wrong value type',
  out_of_range: 'Out-of-range reading', wrong_id: 'Wrong request ID', oversized: 'Oversized response',
  no_newline: 'Incomplete frame', recover_after_disconnect: 'Reconnect and recover',
}
let active = true
let request: AbortController | undefined

async function loadReport() {
  if (loading.value && request) return
  loading.value = true
  error.value = ''
  report.value = null
  const controller = new AbortController()
  request = controller
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('/evidence/normal-report.json', { signal: controller.signal, cache: 'no-cache' })
    const loaded = await readDiagnosticsReport(response)
    if (!active) return
    report.value = loaded
    selected.value = loaded.cases.some(item => item.scenario === 'normal') ? 'normal' : loaded.cases[0].scenario
  } catch {
    if (active) error.value = 'The recorded report could not be loaded. You can still read the case study and download the evidence below.'
  } finally {
    window.clearTimeout(timeout)
    request = undefined
    if (active) loading.value = false
  }
}

onMounted(() => {
  emit('ready')
  void loadReport()
})
onUnmounted(() => {
  active = false
  request?.abort()
})
</script>

<template>
  <section class="case-heading wrap"><a class="back" href="/projects/">All projects</a><p class="eyebrow">Python · TCP communication · Test automation</p><h1>Device<br>Diagnostics Lab</h1><p class="hero-description">A reproducible lab for exploring what happens when device communication fails, and how to prove that the failure was handled.</p><div class="case-facts"><div><span>Project type</span><strong>Personal project · October 2026</strong></div><div><span>Environment</span><strong>TCP loopback · Synthetic readings</strong></div><div><span>Verification</span><strong>44 automated tests passed</strong></div></div></section>
  <section class="case-layout wrap section"><aside class="case-nav"><a href="#problem">The problem</a><a href="#demo">Explore the evidence</a><a href="#design">Design decisions</a><a href="#results">Tests and limitations</a><a href="#reproduce">Run it yourself</a></aside><div class="case-content">
    <section id="problem"><p class="eyebrow">The problem</p><h2>A successful test can contain a failed response.</h2><p>When a test intentionally disconnects a device, a timeout may be the correct observation. The challenge is to keep that observation separate from whether the test met its expectation.</p><p>This project implements a simulator, TCP adapter, strict response validation, bounded retries and a report pipeline. It has not been tested against physical industrial hardware.</p></section>
    <section id="demo"><p class="eyebrow">Recorded evidence</p><h2>Inspect a scenario.</h2><p>Choose a scenario from an actual local simulator run. This viewer replays saved results; it does not connect to a device.</p>
      <p v-if="loading" role="status">Loading the recorded report…</p>
      <div v-else-if="error" class="evidence-error"><p class="error" role="alert">{{ error }}</p><button class="button secondary" type="button" @click="loadReport">Retry loading evidence</button></div>
      <div v-else-if="report" class="evidence-viewer"><label for="scenario">Scenario</label><select id="scenario" v-model="selected"><option v-for="item in report.cases" :key="item.case_id" :value="item.scenario">{{ labels[item.scenario] || item.scenario }}</option></select>
        <template v-if="result"><div class="result-grid"><div><span>Test outcome</span><strong>{{ result.outcome.toUpperCase() }}</strong></div><div><span>Observed diagnostic</span><strong>{{ result.diagnostic }}</strong></div><div><span>Attempts</span><strong>{{ result.attempt_count }}</strong></div></div><p class="expected">Expected: <code>{{ result.expected }}</code></p><ol class="attempts"><li v-for="attempt in result.attempts" :key="attempt.attempt"><div><strong>Attempt {{ attempt.attempt }}</strong><span>{{ attempt.diagnostic }}</span><span>{{ attempt.duration_ms }} ms</span></div><p v-if="attempt.message">{{ attempt.message }}</p><details><summary>Inspect request and response</summary><pre>{{ JSON.stringify({ request: attempt.request, response: attempt.response ?? null }, null, 2) }}</pre></details></li></ol></template>
        <p class="metadata">Captured {{ report.started_at_utc }} · Source {{ report.source_sha256.slice(0, 12) }}</p>
      </div>
      <div class="actions"><a class="text-link" href="/evidence/normal-report.json" download>Download JSON</a><a class="text-link" href="/evidence/normal-cases.csv" download>Download CSV</a><a class="text-link" href="/evidence/failure-report.json" download>Inspect a failing run</a></div>
      <figure><video controls preload="none" aria-label="Walkthrough of saved simulator evidence"><source src="/media/device-evidence-walkthrough.webm" type="video/webm"><track kind="captions" src="/media/device-evidence.vtt" srclang="en" label="English" default>Your browser cannot play this video; use the scenario viewer and raw reports above.</video><figcaption>A one-minute walkthrough of saved simulator evidence. This is not live hardware footage. The interactive viewer and downloads provide the same information if video is unavailable.</figcaption></figure>
    </section>
    <section id="design"><p class="eyebrow">System design</p><h2>Small modules, explicit boundaries.</h2><div class="architecture"><span>JSON configuration</span><b>↓</b><span>Runner and expectation checks</span><b>↓</b><span>TCP adapter ↔ Local simulator</span><b>↓</b><span>JSON · CSV · Attempt logs</span></div><div class="decision"><h3>Retry transport failures only</h3><p>Connections and timeouts can recover. A malformed message or invalid status should be explained immediately rather than repeatedly accepted.</p></div><div class="decision"><h3>Keep evidence complete</h3><p>Each run has a unique ID and a source hash. Reports are written to a staging directory before becoming a completed report, so interrupted exports remain identifiable.</p></div><div class="decision"><h3>Bound the work</h3><p>Each attempt has a deadline and a 16 KiB frame limit. Recovery state is isolated by run and case, preventing one test from silently changing the next.</p></div></section>
    <section id="results"><p class="eyebrow">Verification</p><h2>Show success. Preserve failure.</h2><div class="stats"><div><strong>44</strong><span>automated tests passed</span></div><div><strong>11</strong><span>recorded scenario expectations</span></div><div><strong>1</strong><span>intentional failure in a separate run</span></div></div><p>Integration tests use actual local TCP connections. They check malformed and oversized frames, validation, finite retries, recovery, report consistency and command exit codes.</p><p>In the separate failing run, a missing temperature field was required to be valid. The runner correctly reported a failed test and returned exit code 1.</p><h3>What this evidence does not establish</h3><p>The results come from Windows, Python 3.12.14 and a purpose-built simulator. No physical device, serial interface, environmental reliability or production deployment has been validated. Response times are observations from this run, not performance guarantees.</p></section>
    <section id="reproduce"><p class="eyebrow">Reproduction</p><h2>One command to exercise the lab.</h2><pre>python -m device_diagnostics demo --output reports</pre><p>The application uses the Python standard library. pytest is needed for the development test suite.</p><a class="text-link" href="/downloads/device-diagnostics-lab.zip" download>Download source, tests and reports</a><p>The source bundle includes the implementation, tests, recorded reports and reproduction instructions.</p></section>
  </div></section>
</template>
