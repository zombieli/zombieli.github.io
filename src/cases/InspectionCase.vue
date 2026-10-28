<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import stages from '../data/inspection-journey.json'
import InspectionJourneyMap from './InspectionJourneyMap.vue'
import InspectionRecord from './InspectionRecord.vue'
import InspectionOffline from './InspectionOffline.vue'
import InspectionImport from './InspectionImport.vue'
import './inspection-journey.css'

const emit = defineEmits<{ ready: [] }>()
const currentStage = ref('scope')
let frame: number | undefined
function trackStage() {
  if (frame !== undefined) return
  frame = window.requestAnimationFrame(() => {
    frame = undefined
    let current = stages[0]!.id
    for (const stage of stages) {
      if ((document.getElementById(stage.id)?.getBoundingClientRect().top ?? Infinity) <= Math.min(180, window.innerHeight * .3)) current = stage.id
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
    <p class="eyebrow">JavaScript · IndexedDB · Offline PWA</p>
    <h1>Offline Inspection<br>Notebook</h1>
    <p class="hero-description">A field note should survive a reload. A backup should restore everything, or change nothing. Explore the record rules, offline preparation and recovery decisions behind a device-local inspection notebook.</p>
    <div class="actions"><a class="button primary" href="#inspection-build-map">Explore the build journey</a><a class="button secondary" href="/demos/inspection-notebook/">Open interactive demo</a></div>
    <div class="case-facts"><div><span>Project</span><strong>Personal project · October 2026</strong></div><div><span>Data</span><strong>Fictional training equipment · Local storage</strong></div><div><span>Recorded verification · 13 Oct 2026</span><strong>35 domain tests · 20 browser checks</strong></div></div>
  </section>
  <InspectionJourneyMap />
  <section class="case-layout wrap section inspection-journey">
    <nav class="case-nav inspection-journey-nav" aria-label="Build journey">
      <div class="inspection-nav-intro"><strong>Build journey</strong><span>Six stages, with evidence.</span></div>
      <a v-for="(stage, index) in stages" :key="stage.id" :href="'#' + stage.id" :aria-current="currentStage === stage.id ? 'step' : undefined"><span class="inspection-stage-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ stage.label }}</span></a>
    </nav>
    <div class="case-content">
      <section id="scope" class="inspection-stage">
        <p class="eyebrow">01 / Define local records</p><h2>Start with what must survive.</h2>
        <p>A fictional training inspection needs an editable draft, a completed record and a way to carry a backup to another browser. These have different failure boundaries, even without an account or server.</p>
        <dl class="inspection-brief"><div><dt>Capture</dt><dd>Choose one of three training assets, record its condition and complete three checks. Notes are optional.</dd></div><div><dt>Protect</dt><dd>Save drafts explicitly. Keep submitted records read-only and reject a stale tab’s attempt to replace newer work.</dd></div><div><dt>Recover</dt><dd>Export structured JSON. Restore a whole valid backup in one transaction, with no overwritten IDs or partial imports.</dd></div></dl>
        <p class="inspection-handoff">Keep the record rules in a pure module. Let storage and the interface enforce the same lifecycle.</p>
        <a class="text-link" href="/evidence/inspection-notebook-architecture.md">Read the original architecture</a>
      </section>
      <section id="records" class="inspection-stage">
        <p class="eyebrow">02 / Protect the lifecycle</p><h2>A saved draft is a specific snapshot.</h2>
        <p>The real notebook persists an empty draft when it is created. Typing then edits the form; Save draft persists those changes. Submission requires an asset, condition and all three checks.</p>
        <InspectionRecord />
        <p>During persistence, all fields and Close are locked. Success appears only when the transaction completes. The storage layer also compares the expected edit timestamp inside the transaction, so a stale tab cannot silently replace a newer draft.</p>
        <p class="inspection-handoff">Record persistence and offline page loading are separate responsibilities. Make both visible.</p>
      </section>
      <section id="offline" class="inspection-stage">
        <p class="eyebrow">03 / Prepare offline access</p><h2>Cache the page. Store the records.</h2>
        <p>The service worker keeps the application shell available; IndexedDB keeps inspection records. Offline readiness requires a successful first online load and an active worker controlling the demo.</p>
        <InspectionOffline />
        <p>The worker caches only its own demo directory. Browser profiles, domains and ports have separate storage. Clearing site data removes both records and cached files; exported backups provide a separate copy.</p>
        <p class="inspection-handoff">Local persistence handles a reload. Explicit export and import handle moving or recovering records.</p>
      </section>
      <section id="recovery" class="inspection-stage">
        <p class="eyebrow">04 / Restore atomically</p><h2>A conflict must leave nothing half restored.</h2>
        <p>Validate the backup before insertion, then add all records in one read/write transaction. An existing ID is a conflict even if its contents are identical. Any failed addition aborts the whole import.</p>
        <InspectionImport />
        <details class="inspection-disclosure"><summary>Inspect the backup contract</summary><pre>{
  "schemaVersion": 1,
  "exportedAt": "2026-10-13T09:00:00.000Z",
  "records": [ /* validated draft or submitted records */ ]
}</pre><p class="metadata">Illustrative shape; the comment is not part of a valid JSON backup. Unknown fields, invalid types, malformed timestamps and repeated IDs inside a file are rejected. Maximum: 1,000 records and 16,000,000 UTF-8 bytes. Notes are limited to 2,000 UTF-16 code units per record.</p></details>
        <p class="inspection-handoff">Test the failed transaction as carefully as the successful one. Queued writes must leave no residue.</p>
      </section>
      <section id="verification" class="inspection-stage">
        <p class="eyebrow">05 / Challenge failure boundaries</p><h2>Keep the failure that changed the design.</h2>
        <p>The original development log records concrete failures and their fixes. These examples connect the interaction rules above to the implementation work.</p>
        <div class="inspection-failures"><article><span>01 / Pending write</span><h3>Typing could outlive the saved snapshot.</h3><p>Lock every editable control and Close while the write is pending. Unlock draft inputs after completion; keep submitted records fixed.</p></article><article><span>02 / Duplicate restore</span><h3>Later aborts hid the useful error.</h3><p>Retain the first failure. Abort once, keep the existing notebook intact and report the conflicting ID.</p></article><article><span>03 / Same clock</span><h3>Two edits shared one timestamp.</h3><p>Advance a draft’s edit time by at least one millisecond, including a repeated clock value or a small backward clock movement.</p></article><article><span>04 / Backup boundary</span><h3>A valid export could exceed its import limit.</h3><p>Account for JSON-escaped notes across a full notebook. The final byte bound is 16 MB, alongside the 1,000-record limit.</p></article></div>
        <div class="stats"><div><strong>35</strong><span>recorded domain tests</span></div><div><strong>20</strong><span>recorded browser checks</span></div><div><strong>4</strong><span>checked viewport widths</span></div></div>
        <p>Captured on 13 October 2026, 10:20 (UTC+8), for v1.1.0 using Node 24.19.0 and desktop Chrome 154.0.8037.98. Browser checks cover pending writes, stale drafts, offline reload, transactional rollback and 360 / 390 / 768 / 1440 px layouts.</p>
        <div class="actions"><a class="text-link" href="/evidence/inspection-notebook-verification.json">Inspect the dated verification</a><a class="text-link" href="/evidence/inspection-notebook-development.md">Read the observed failures and fixes</a></div>
      </section>
      <section id="reproduce" class="inspection-stage">
        <p class="eyebrow">06 / Package reproducibility</p><h2>Open the notebook. Inspect the evidence.</h2>
        <p>The standalone demo starts with your browser’s local notebook. You can explicitly load fictional examples, create a draft, submit it and export a backup. The diagrams on this case page are isolated examples and never write to that notebook.</p>
        <div class="actions"><a class="button primary" href="/demos/inspection-notebook/">Open interactive demo</a><a class="button secondary" href="/downloads/inspection-notebook.zip" download>Download source and tests</a></div>
        <details class="inspection-disclosure inspection-capture"><summary>See the original demo capture</summary><figure><img src="/media/inspection-notebook.png" alt="Original browser capture of the inspection notebook with explicitly loaded fictional training records" loading="lazy" width="1440" height="1100"><figcaption>Original demo capture; the downloadable verification records the tested environment.</figcaption></figure></details>
        <h3>Run the source locally</h3><pre>npm test
npm run serve</pre>
        <p>Use Node 24 from the extracted source directory, then open <code>http://127.0.0.1:4175/demos/inspection-notebook/</code>. The application needs no build step or external runtime dependencies. The README documents the separate Playwright and Chrome setup for browser checks.</p>
        <div class="inspection-files"><a href="/evidence/inspection-notebook-readme.md"><strong>README</strong><span>Run, test and review the notebook</span></a><a href="/evidence/inspection-notebook-architecture.md"><strong>Architecture</strong><span>Domain, storage and cached shell</span></a><a href="/evidence/inspection-notebook-development.md"><strong>Development log</strong><span>Observed failures and decisions</span></a></div>
        <h3>Scope and contribution</h3><p>The project covers the record model, storage transactions, offline workflow, backup recovery and verification. The six stages group that documented process; they do not represent six individual commits.</p>
        <p>Physical phones, installation prompts, quota exhaustion and storage eviction were not tested. There is no server sync, equipment connection, deletion workflow or cryptographic sealing. Submitted records are read-only through the application; developer tools can still alter local storage.</p>
      </section>
    </div>
  </section>
</template>
