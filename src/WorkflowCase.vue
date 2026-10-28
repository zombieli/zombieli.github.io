<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import WorkflowJourneyMap from './cases/WorkflowJourneyMap.vue'
import WorkflowLifecycle from './cases/WorkflowLifecycle.vue'
import WorkflowServices from './cases/WorkflowServices.vue'
import WorkflowWriteSafety from './cases/WorkflowWriteSafety.vue'
import stages from './data/workflow-journey.json'
import './cases/workflow-journey.css'
const emit = defineEmits<{ ready: [] }>()
const currentStage = ref(stages[0]!.id)
let frame: number | undefined
function trackStage() {
  if (frame !== undefined) return
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    const threshold = Math.min(180, window.innerHeight * .3)
    let current = stages[0]!.id
    for (const stage of stages) {
      if ((document.getElementById(stage.id)?.getBoundingClientRect().top ?? Infinity) <= threshold) current = stage.id
    }
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = stages[stages.length - 1]!.id
    currentStage.value = current
  })
}
onMounted(() => {
  emit('ready')
  window.addEventListener('scroll', trackStage, { passive: true })
  window.addEventListener('resize', trackStage)
  trackStage()
})
onUnmounted(() => {
  window.removeEventListener('scroll', trackStage)
  window.removeEventListener('resize', trackStage)
  if (frame !== undefined) window.cancelAnimationFrame(frame)
})
</script>

<template>
  <section class="case-heading wrap">
    <a class="back" href="/projects/">All projects</a>
    <p class="eyebrow">Vue · FastAPI · SQLite · Workflow rules</p>
    <h1>Field Service<br>Workflow</h1>
    <p class="hero-description">A fault becomes a work order. Every change needs a reason, a valid next step and a history that stays with the record. Explore how those rules became a working application.</p>
    <div class="actions"><a class="button primary" href="#workflow-build-map">Explore the build journey</a><a class="button secondary" href="/field-service-workflow/">Open interactive demo</a></div>
    <div class="case-facts"><div><span>Project</span><strong>Personal project · October 2026</strong></div><div><span>Environment</span><strong>Fictional workshop · Synthetic records</strong></div><div><span>Recorded verification · 8–9 Oct 2026</span><strong>37 API tests · 27 demo tests</strong></div></div>
  </section>
  <WorkflowJourneyMap />
  <section class="case-layout wrap section workflow-journey">
    <nav class="case-nav workflow-journey-nav" aria-label="Build journey">
      <div class="workflow-nav-intro"><strong>Build journey</strong><span>Six stages, with evidence.</span></div>
      <a v-for="(stage, index) in stages" :key="stage.id" :href="`#${stage.id}`" :aria-current="currentStage === stage.id ? 'step' : undefined"><span class="workflow-stage-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ stage.label }}</span></a>
    </nav>
    <div class="case-content">
      <section id="scope" class="workflow-stage">
        <p class="eyebrow">01 / Scope the record</p><h2>A status alone cannot tell the story.</h2>
        <p>A workshop needs to know which device has a fault, who it is assigned to and what treatment resolved it. Changing a label is easy. Keeping the current record and its explanation consistent is the real problem.</p>
        <dl class="workflow-brief"><div><dt>The goal</dt><dd>Take a synthetic fault from reporting to closure, with a traceable event for every accepted change.</dd></div><div><dt>The boundary</dt><dd>Three fictional assets, five statuses and technician labels. No employer data or authenticated user identities.</dd></div><div><dt>Acceptance</dt><dd>Block invalid changes, require the missing information and preserve the last valid record when a write fails.</dd></div></dl>
        <p class="workflow-handoff">Start by making the allowed changes explicit. The same rules must hold in the browser demo and the local API.</p>
        <a class="text-link" href="/evidence/workflow-design.md">Read the original design</a>
      </section>
      <section id="lifecycle" class="workflow-stage">
        <p class="eyebrow">02 / Define the lifecycle</p><h2>Every arrow has a rule.</h2>
        <p>A shared <code>contract.json</code> defines five states and the legal transitions. Assignment requires a technician label; resolution requires a treatment note. A resolved order can reopen. A closed order is final.</p>
        <WorkflowLifecycle />
        <p class="workflow-handoff">Reopening clears the current assignment and resolution, while the earlier events still explain what happened.</p>
        <a class="text-link" href="/evidence/workflow-contract.json">Inspect the shared contract</a>
      </section>
      <section id="services" class="workflow-stage">
        <p class="eyebrow">03 / Separate the services</p><h2>One interface. Two ways to run it.</h2>
        <p>The Vue interface talks to a service boundary. This lets a reviewer try the browser version immediately, while the local version exercises real API validation and SQLite persistence.</p>
        <WorkflowServices />
        <p class="workflow-handoff">The shared contract keeps status rules aligned. Database transactions belong to the local API and are tested there separately.</p>
      </section>
      <section id="write-safety" class="workflow-stage">
        <p class="eyebrow">04 / Protect each change</p><h2>Save the record and its history together.</h2>
        <p>The API begins a write transaction and compares the submitted version with the current record. It validates the change, updates the work order and inserts the event before committing. A stale version is rejected; an event-insert failure rolls the transaction back.</p>
        <WorkflowWriteSafety />
        <p class="workflow-handoff">On request failure, the actual interface keeps the user's input and offers a record reload. It does not silently merge a conflicting edit.</p>
      </section>
      <section id="verification" class="workflow-stage">
        <p class="eyebrow">05 / Challenge the rules</p><h2>Test the paths that must not succeed.</h2>
        <p>Both implementations test all 25 origin/target status pairs. The API suite also deliberately rejects an event insert: neither the status update nor a new order may survive without its history.</p>
        <div class="workflow-verification-grid"><div><h3>Domain boundaries</h3><p>Required labels and notes, invalid transitions, unexpected fields and stale versions.</p></div><div><h3>Storage boundaries</h3><p>Atomic creation and updates, unique event versions and persistence after restart.</p></div><div><h3>Interface recovery</h3><p>Required notes, filtering, reset and draft retention after a failed API request.</p></div></div>
        <div class="stats"><div><strong>37</strong><span>API tests in the original verification</span></div><div><strong>27</strong><span>browser-service unit tests</span></div><div><strong>2</strong><span>browser modes accepted</span></div></div>
        <p>These are recorded results from 8–9 October 2026. Browser acceptance completed create, assign, work, resolve and close in both modes, with five history entries. It checked 360, 390, 768 and 1440 px viewports in desktop Chrome.</p>
        <details class="workflow-disclosure"><summary>See the recorded application screen</summary><figure><img src="/media/workflow-desktop.png" alt="Recorded browser capture of a synthetic Closed work order with five history entries" loading="lazy" width="1440" height="1705"><figcaption>Original browser acceptance capture. The interactive diagrams above explain the source rules using separate synthetic examples.</figcaption></figure></details>
        <div class="actions"><a class="text-link" href="/evidence/workflow-browser-results.json" download>Download browser check results</a><a class="text-link" href="/evidence/workflow-development.md">Read the development log</a></div>
      </section>
      <section id="delivery" class="workflow-stage">
        <p class="eyebrow">06 / Package the work</p><h2>Try the workflow. Inspect the implementation.</h2>
        <div class="workflow-delivery"><div><h3>Try it in this browser</h3><p>The separate demo includes the list, filters, creation form and event history. Its synthetic records reset on refresh.</p><a class="text-link" href="/field-service-workflow/">Open interactive demo</a></div><div><h3>Run the full local application</h3><p>The source bundle includes Vue, FastAPI, SQLite setup, the shared contract and tests.</p><a class="text-link" href="/downloads/field-service-workflow.zip" download>Download source and tests</a></div></div>
        <h3>Start the local API</h3><pre>python -m pip install -r requirements-dev.txt
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8001</pre>
        <p>Run from the extracted source directory with Python 3.12. In a second terminal, follow the README to install the Vue frontend with Node 24 and select API mode. Use <code>WORKFLOW_DB</code> to choose an independent database path. Times are stored in UTC and displayed in Perth time.</p>
        <h3>Scope and contribution</h3><p>The implementation covers the shared contract, API, transaction handling, service separation, interface and tests. It contains no employer code. Actor labels are not authenticated identities; production authorisation, tamper-resistant history, attachments, pagination and multi-user browser persistence are outside this version.</p>
        <p class="metadata">The six stages group the documented development process rather than individual commits. Historical test results are evidence of those runs, not a load test, formal accessibility audit or physical-device check. The diagrams are source-backed explanations; their animation timing is illustrative.</p>
      </section>
    </div>
  </section>
</template>
