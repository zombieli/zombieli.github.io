<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { readDiagnosticsReport } from '../lib/diagnostics-report'
import type { DiagnosticReport } from '../lib/diagnostics-report'
import DiagnosticsRetry from './DiagnosticsRetry.vue'
import DiagnosticsExpectation from './DiagnosticsExpectation.vue'
import DiagnosticsJourneyMap from './DiagnosticsJourneyMap.vue'
import DiagnosticsArchitecture from './DiagnosticsArchitecture.vue'
import stages from '../data/diagnostics-journey.json'
import './diagnostics-journey.css'

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
const currentStage = ref(stages[0]!.id)
let scrollFrame: number | undefined

function trackStage() {
  if (scrollFrame !== undefined) return
  scrollFrame = window.requestAnimationFrame(() => {
    const threshold = Math.min(180, window.innerHeight * .3)
    let current = stages[0]!.id
    for (const stage of stages) {
      if ((document.getElementById(stage.id)?.getBoundingClientRect().top ?? Infinity) <= threshold) current = stage.id
    }
    // A tall viewport can reach the page end before the last heading crosses the threshold.
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = stages[stages.length - 1]!.id
    }
    currentStage.value = current
    scrollFrame = undefined
  })
}

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
  window.addEventListener('scroll', trackStage, { passive: true })
  window.addEventListener('resize', trackStage)
  trackStage()
  void loadReport()
})
onUnmounted(() => {
  active = false
  request?.abort()
  window.removeEventListener('scroll', trackStage)
  window.removeEventListener('resize', trackStage)
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <section class="case-heading wrap">
    <a class="back" href="/projects/">All projects</a>
    <p class="eyebrow">Python · TCP communication · Test automation</p>
    <h1>Device<br>Diagnostics Lab</h1>
    <p class="hero-description">From an unreliable response to a result you can explain. Follow the decisions behind a reproducible device-communication test bench.</p>
    <div class="actions"><a class="button primary" href="#build-map">Explore the build journey</a><a class="button secondary" href="#demo">Inspect recorded evidence</a></div>
    <div class="case-facts"><div><span>Project type</span><strong>Personal project · October 2026</strong></div><div><span>Environment</span><strong>TCP loopback · Synthetic readings</strong></div><div><span>Recorded verification · 8 Oct 2026</span><strong>44 automated tests passed</strong></div></div>
  </section>
  <DiagnosticsJourneyMap />
  <section class="case-layout wrap section diagnostics-journey">
    <nav class="case-nav journey-nav" aria-label="Build journey">
      <div class="journey-nav-intro"><strong>Build journey</strong><span>Six stages, with evidence.</span></div>
      <a v-for="(stage, index) in stages" :key="stage.id" :href="`#${stage.id}`" :aria-current="currentStage === stage.id ? 'step' : undefined"><span class="journey-step-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ stage.label }}</span></a>
    </nav>
    <div class="case-content">
      <section id="problem" class="journey-stage">
        <p class="eyebrow">01 / Scope the problem</p><h2>A successful test can contain a failed response.</h2>
        <p>When a test deliberately stalls a response, detecting a timeout is the correct result. The challenge is to separate what happened during communication from whether the test met its expectation.</p>
        <dl class="journey-brief"><div><dt>The goal</dt><dd>Identify communication faults, verify recovery and preserve enough evidence to explain each result.</dd></div><div><dt>The first boundary</dt><dd>Use a local TCP simulator and synthetic readings. Physical-device support is outside this version.</dd></div><div><dt>Acceptance</dt><dd>Detect known faults, stop within defined limits, report unexpected results as failures and make the run reproducible.</dd></div></dl>
        <p class="journey-handoff">First define what a valid response means. Then a failure can be classified consistently.</p>
        <a class="text-link" href="/evidence/diagnostics-development.md">Read the original development log</a>
      </section>

      <section id="contract" class="journey-stage">
        <p class="eyebrow">02 / Define the contract</p><h2>Make “valid” an explicit agreement.</h2>
        <p>The project-specific <code>diagnostics-sim/1</code> protocol uses one JSON object followed by a newline, with one request per TCP connection. A response must match the request and pass field validation.</p>
        <div class="journey-contract"><div><h3>Identity</h3><p>Echo <code>protocol</code> and <code>request_id</code>. Require a device ID, firmware and recognised status.</p></div><div><h3>Readings</h3><p>Require finite numbers: temperature −50 to 150 °C and supply voltage 0 to 60 V. These are lab validation ranges.</p></div><div><h3>Limits</h3><p>Bound every attempt with a deadline and a 16 KiB frame limit. Reject incomplete or malformed frames.</p></div></div>
        <details class="journey-disclosure"><summary>See an illustrative request</summary><pre>{
  "protocol": "diagnostics-sim/1",
  "request_id": "example-request",
  "run_case_id": "example-run:CASE-01",
  "operation": "get_status",
  "scenario": "normal"
}</pre><p class="metadata">Illustrative identifiers. The recorded viewer below contains the actual requests.</p></details>
        <p class="journey-handoff">The requirement map connects each rule to its implementation and verification.</p>
        <a class="text-link" href="/evidence/diagnostics-protocol.md">Read the protocol and requirement map</a>
      </section>

      <section id="design" class="journey-stage">
        <p class="eyebrow">03 / Divide the system</p><h2>Small modules, explicit boundaries.</h2>
        <p>Separate fault generation, communication and judgement so a test can explain where something went wrong. Select a module to trace its connections.</p>
        <DiagnosticsArchitecture />
        <p class="journey-handoff">With these boundaries in place, recovery can be tested without hiding an invalid response.</p>
        <a class="text-link" href="/evidence/diagnostics-case-study.md">Read the implementation decisions</a>
      </section>

      <section id="fault-handling" class="journey-stage">
        <p class="eyebrow">04 / Handle the faults</p><h2>Retry a connection. Explain a bad message.</h2>
        <p>A dropped connection can recover. Invalid JSON should be reported immediately. The runner retries transport failures only, within a finite attempt limit.</p>
        <DiagnosticsRetry :report="report" :loading="loading" :error="error" @retry="loadReport" />
        <p class="journey-handoff">Recovery is only one part of correctness. Next, check that the runner can recognise an unexpected result.</p>
      </section>

      <section id="results" class="journey-stage">
        <p class="eyebrow">05 / Challenge the result</p><h2>Show success. Preserve failure.</h2>
        <p>The same missing field can be an expected fault or an unexpected defect. These two saved runs keep the observed diagnostic separate from the test outcome.</p>
        <DiagnosticsExpectation :report="report" :loading="loading" :error="error" @retry="loadReport" />
        <div class="stats"><div><strong>44</strong><span>automated tests passed in the initial verification</span></div><div><strong>11</strong><span>scenario expectations passed in the normal run</span></div><div><strong>1</strong><span>intentional failure in the separate run</span></div></div>
        <p>Recorded on 8 October 2026, using Windows, Python 3.12.14 and pytest 9.1.1. Integration tests use actual local TCP connections and cover validation, bounded retries, recovery, report consistency and CLI exit codes. Nine of the eleven normal-run scenarios deliberately produce diagnostic faults.</p>
        <h3>What this evidence does not establish</h3><p>No physical device, serial interface, environmental reliability or production deployment has been validated. Response times are observations from those runs, not performance guarantees.</p>
        <div id="demo" class="journey-evidence-library"><p class="eyebrow">Recorded evidence / All 11 scenarios</p><h3>Inspect a scenario.</h3><p>Explore the full saved simulator run, including every attempt and request. This viewer does not connect to a device.</p>
      <p v-if="loading" role="status">Loading the recorded report…</p>
      <div v-else-if="error" class="evidence-error"><p class="error" role="alert">{{ error }}</p><button class="button secondary" type="button" @click="loadReport">Retry loading evidence</button></div>
      <div v-else-if="report" class="evidence-viewer"><label for="scenario">Scenario</label><select id="scenario" v-model="selected"><option v-for="item in report.cases" :key="item.case_id" :value="item.scenario">{{ labels[item.scenario] || item.scenario }}</option></select>
        <template v-if="result"><div class="result-grid"><div><span>Test outcome</span><strong>{{ result.outcome.toUpperCase() }}</strong></div><div><span>Observed diagnostic</span><strong>{{ result.diagnostic }}</strong></div><div><span>Attempts</span><strong>{{ result.attempt_count }}</strong></div></div><p class="expected">Expected: <code>{{ result.expected }}</code></p><ol class="attempts"><li v-for="attempt in result.attempts" :key="attempt.attempt"><div><strong>Attempt {{ attempt.attempt }}</strong><span>{{ attempt.diagnostic }}</span><span>{{ attempt.duration_ms }} ms</span></div><p v-if="attempt.message">{{ attempt.message }}</p><details><summary>Inspect request and response</summary><pre>{{ JSON.stringify({ request: attempt.request, response: attempt.response ?? null }, null, 2) }}</pre></details></li></ol></template>
        <p class="metadata">Captured {{ report.started_at_utc }} · Source {{ report.source_sha256.slice(0, 12) }}</p>
      </div>
      <div class="actions"><a class="text-link" href="/evidence/normal-report.json" download>Download JSON</a><a class="text-link" href="/evidence/normal-cases.csv" download>Download CSV</a><a class="text-link" href="/evidence/failure-report.json" download>Inspect a failing run</a></div>
      <figure><video controls preload="none" aria-label="Walkthrough of saved simulator evidence"><source src="/media/device-evidence-walkthrough.webm" type="video/webm"><track kind="captions" src="/media/device-evidence.vtt" srclang="en" label="English" default>Your browser cannot play this video; use the scenario viewer and raw reports above.</video><figcaption>A one-minute walkthrough of saved simulator evidence. This is not live hardware footage. The interactive viewer and downloads provide the same information if video is unavailable.</figcaption></figure>
        </div>
      </section>
      <section id="reproduce" class="journey-stage">
        <p class="eyebrow">06 / Package the evidence</p><h2>Leave a result someone else can reproduce.</h2>
        <p>Each run has its own identity, environment details, configuration and source SHA-256. Reports are staged before the directory is renamed, so incomplete writes are not presented as completed results.</p>
        <div class="journey-files"><div><code>report.json</code><span>Summary, cases and attempts</span></div><div><code>cases.csv</code><span>One row per test case</span></div><div><code>events.jsonl</code><span>Recorded attempt events</span></div></div>
        <h3>Run it yourself</h3><pre>python -m device_diagnostics demo --output reports</pre>
        <p>Run from the extracted source directory with Python 3.11 or later. The application uses the Python standard library; pytest is needed for the development test suite.</p>
        <a class="text-link" href="/downloads/device-diagnostics-lab.zip" download>Download source, tests and reports</a>
        <p class="metadata">The bundle includes the implementation, tests, original documents and recorded outputs. The six stages above group the documented development sequence; they are not a reconstruction of individual commits.</p>
      </section>
  </div></section>
</template>
