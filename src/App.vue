<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import WorkflowCase from './WorkflowCase.vue'
import SchedulingCase from './SchedulingCase.vue'
import FeaturedProjects from './components/FeaturedProjects.vue'
import ProjectLibrary from './components/ProjectLibrary.vue'
import StandardCase from './components/StandardCase.vue'
import { catalogue } from './catalogue'

const props = defineProps<{ page: string; projectId?: string }>()
const project = catalogue.projects.find(project => project.id === props.projectId)
const category = catalogue.categories.find(category => category.id === project?.categoryId)
type Attempt = { attempt: number; diagnostic: string; duration_ms: number; request: Record<string, unknown>; response?: Record<string, unknown>; message?: string }
type Case = { case_id: string; scenario: string; expected: string; diagnostic: string; outcome: string; attempt_count: number; duration_ms: number; attempts: Attempt[] }
type Report = { run_id: string; source_sha256: string; started_at_utc: string; evidence_origin: string; cases: Case[]; summary: Record<string, number> }
const menuOpen = ref(false)
const report = ref<Report | null>(null)
const error = ref('')
const selected = ref('normal')
const result = computed(() => report.value?.cases.find(item => item.scenario === selected.value))
const labels: Record<string, string> = { normal: 'Healthy response', timeout: 'Response timeout', disconnect: 'Peer disconnect', malformed: 'Malformed JSON', missing_field: 'Missing status field', wrong_type: 'Wrong value type', out_of_range: 'Out-of-range reading', wrong_id: 'Wrong request ID', oversized: 'Oversized response', no_newline: 'Incomplete frame', recover_after_disconnect: 'Reconnect and recover' }
onMounted(async () => {
  if (props.page !== 'diagnostics') return
  try {
    const response = await fetch('/evidence/normal-report.json')
    if (!response.ok) throw new Error('Report unavailable')
    report.value = await response.json()
  } catch { error.value = 'The recorded report could not be loaded. You can still read the case study and download the evidence below.' }
})
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header wrap">
    <a class="brand" href="/" aria-label="Leon Li home"><span class="monogram">L</span> Leon Li</a>
    <button class="menu-button" :aria-expanded="menuOpen" aria-controls="navigation" @click="menuOpen = !menuOpen">Menu</button>
    <nav id="navigation" :class="{ open: menuOpen }" aria-label="Main navigation">
      <a href="/projects/" :aria-current="page === 'projects' ? 'page' : undefined" @click="menuOpen = false">Projects</a><a href="/#about" @click="menuOpen = false">About</a><a href="/resume/leon-li-resume.pdf">Resume</a><a href="mailto:ziangli092@gmail.com">Contact</a>
    </nav>
  </header>

  <main id="main">
    <template v-if="page === 'home'">
      <section class="hero wrap">
        <div><p class="eyebrow">PERTH, WESTERN AUSTRALIA</p><h1>Software engineering.<br><span>Testing in practice.</span></h1>
          <p class="hero-description">I’m Leon, a Software Engineering student at Curtin University. My work explores how applications communicate, handle failures and make their behaviour easier to understand.</p>
          <div class="actions"><a class="button primary" href="#projects">Explore my projects</a><a class="button secondary" href="/resume/leon-li-resume.pdf">Download resume</a></div>
        </div>
        <aside class="intro-note"><span class="note-number">01 / CURRENT FOCUS</span><h2>From a response<br>to reliable evidence.</h2><p>Device communication, repeatable tests and clear explanations of what actually happened.</p><dl><div><dt>Study</dt><dd>Master of Professional Engineering</dd></div><div><dt>Specialisation</dt><dd>Software Engineering</dd></div><div><dt>Graduation</dt><dd>Expected June 2027</dd></div></dl></aside>
      </section>

      <FeaturedProjects />

      <section id="about" class="about wrap section"><div><p class="eyebrow">ABOUT ME</p><h2>A software foundation.<br>A practical direction.</h2></div><div><p>I’m studying Software Engineering at Curtin University, following a dual Bachelor of Engineering qualification from the University of Aberdeen and South China Normal University.</p><p>My experience includes Java and Android development, Python simulation, API integration and functional testing. I’m interested in internship opportunities where software meets devices, engineering tools and operational workflows.</p><dl class="availability"><div><dt>Internship start</dt><dd>January 2027 preferred; available from November 2026</dd></div><div><dt>Availability</dt><dd>Full-time during university holidays, subject to visa conditions</dd></div><div><dt>Work rights</dt><dd>Student visa subclass 500</dd></div></dl><div class="actions"><a class="text-link" href="https://github.com/zombieli">GitHub</a><a class="text-link" href="https://www.linkedin.com/in/leon-li-a52208375/">LinkedIn</a></div></div></section>
      <section class="contact wrap section"><p class="eyebrow">GET IN TOUCH</p><h2>Let’s discuss an internship.</h2><a href="mailto:ziangli092@gmail.com">ziangli092@gmail.com</a></section>
    </template>

    <ProjectLibrary v-else-if="page === 'projects'" />
    <StandardCase v-else-if="page === 'standard' && project && category" :project="project" :category="category" />
    <template v-else-if="page === 'diagnostics'">
      <section class="case-heading wrap"><a class="back" href="/projects/">All projects</a><p class="eyebrow">PYTHON · TCP COMMUNICATION · TEST AUTOMATION</p><h1>Device<br>Diagnostics Lab</h1><p class="hero-description">A reproducible lab for exploring what happens when device communication fails, and how to prove that the failure was handled.</p><div class="case-facts"><div><span>PROJECT TYPE</span><strong>Personal project · October 2026</strong></div><div><span>ENVIRONMENT</span><strong>TCP loopback · Synthetic readings</strong></div><div><span>VERIFICATION</span><strong>44 automated tests passed</strong></div></div></section>
      <section class="case-layout wrap section"><aside class="case-nav"><a href="#problem">The problem</a><a href="#demo">Explore the evidence</a><a href="#design">Design decisions</a><a href="#results">Tests and limitations</a><a href="#reproduce">Run it yourself</a></aside><div class="case-content">
        <section id="problem"><p class="eyebrow">THE PROBLEM</p><h2>A successful test can contain a failed response.</h2><p>When a test intentionally disconnects a device, a timeout may be the correct observation. The challenge is to keep that observation separate from whether the test met its expectation.</p><p>This project implements a simulator, TCP adapter, strict response validation, bounded retries and a report pipeline. It has not been tested against physical industrial hardware.</p></section>
        <section id="demo"><p class="eyebrow">RECORDED EVIDENCE</p><h2>Inspect a scenario.</h2><p>Choose a scenario from an actual local simulator run. This viewer replays saved results; it does not connect to a device.</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <div v-else-if="report" class="evidence-viewer"><label for="scenario">Scenario</label><select id="scenario" v-model="selected"><option v-for="item in report.cases" :key="item.case_id" :value="item.scenario">{{ labels[item.scenario] || item.scenario }}</option></select>
            <template v-if="result"><div class="result-grid"><div><span>TEST OUTCOME</span><strong>{{ result.outcome.toUpperCase() }}</strong></div><div><span>OBSERVED DIAGNOSTIC</span><strong>{{ result.diagnostic }}</strong></div><div><span>ATTEMPTS</span><strong>{{ result.attempt_count }}</strong></div></div><p class="expected">Expected: <code>{{ result.expected }}</code></p><ol class="attempts"><li v-for="attempt in result.attempts" :key="attempt.attempt"><div><strong>Attempt {{ attempt.attempt }}</strong><span>{{ attempt.diagnostic }}</span><span>{{ attempt.duration_ms }} ms</span></div><p v-if="attempt.message">{{ attempt.message }}</p><details><summary>Inspect request and response</summary><pre>{{ JSON.stringify({ request: attempt.request, response: attempt.response ?? null }, null, 2) }}</pre></details></li></ol></template>
            <p class="metadata">Captured {{ report.started_at_utc }} · Source {{ report.source_sha256.slice(0, 12) }}</p>
          </div><p v-else role="status">Loading the recorded report…</p>
          <div class="actions"><a class="text-link" href="/evidence/normal-report.json" download>Download JSON</a><a class="text-link" href="/evidence/normal-cases.csv" download>Download CSV</a><a class="text-link" href="/evidence/failure-report.json" download>Inspect a failing run</a></div>
          <figure><video controls preload="none" aria-label="Walkthrough of saved simulator evidence"><source src="/media/device-evidence-walkthrough.webm" type="video/webm"><track kind="captions" src="/media/device-evidence.vtt" srclang="en" label="English" default>Your browser cannot play this video; use the scenario viewer and raw reports above.</video><figcaption>A one-minute walkthrough of saved simulator evidence. This is not live hardware footage. The interactive viewer and downloads provide the same information if video is unavailable.</figcaption></figure>
        </section>
        <section id="design"><p class="eyebrow">SYSTEM DESIGN</p><h2>Small modules, explicit boundaries.</h2><div class="architecture"><span>JSON configuration</span><b>↓</b><span>Runner and expectation checks</span><b>↓</b><span>TCP adapter ↔ Local simulator</span><b>↓</b><span>JSON · CSV · Attempt logs</span></div><div class="decision"><h3>Retry transport failures only</h3><p>Connections and timeouts can recover. A malformed message or invalid status should be explained immediately rather than repeatedly accepted.</p></div><div class="decision"><h3>Keep evidence complete</h3><p>Each run has a unique ID and a source hash. Reports are written to a staging directory before becoming a completed report, so interrupted exports remain identifiable.</p></div><div class="decision"><h3>Bound the work</h3><p>Each attempt has a deadline and a 16 KiB frame limit. Recovery state is isolated by run and case, preventing one test from silently changing the next.</p></div></section>
        <section id="results"><p class="eyebrow">VERIFICATION</p><h2>Show success. Preserve failure.</h2><div class="stats"><div><strong>44</strong><span>automated tests passed</span></div><div><strong>11</strong><span>recorded scenario expectations</span></div><div><strong>1</strong><span>intentional failure in a separate run</span></div></div><p>Integration tests use actual local TCP connections. They check malformed and oversized frames, validation, finite retries, recovery, report consistency and command exit codes.</p><p>In the separate failing run, a missing temperature field was required to be valid. The runner correctly reported a failed test and returned exit code 1.</p><h3>What this evidence does not establish</h3><p>The results come from Windows, Python 3.12.14 and a purpose-built simulator. No physical device, serial interface, environmental reliability or production deployment has been validated. Response times are observations from this run, not performance guarantees.</p></section>
        <section id="reproduce"><p class="eyebrow">REPRODUCTION</p><h2>One command to exercise the lab.</h2><pre>python -m device_diagnostics demo --output reports</pre><p>The application uses the Python standard library. pytest is needed for the development test suite.</p><a class="text-link" href="/downloads/device-diagnostics-lab.zip" download>Download source, tests and reports</a><p>The source bundle includes the implementation, tests, recorded reports and reproduction instructions.</p></section>
      </div></section>
    </template>
    <WorkflowCase v-else-if="page === 'workflow'" />
    <SchedulingCase v-else-if="page === 'scheduling'" />
  </main>
  <footer class="wrap site-footer"><span>Leon Li · Perth, Western Australia</span><a href="https://github.com/zombieli">GitHub</a><a href="https://www.linkedin.com/in/leon-li-a52208375/">LinkedIn</a><span>© 2026</span></footer>
</template>
