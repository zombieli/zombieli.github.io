<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import results from './data/scheduling-results.json'
import stages from './data/scheduling-journey.json'
import SchedulingJourneyMap from './cases/SchedulingJourneyMap.vue'
import SchedulingDispatch from './cases/SchedulingDispatch.vue'
import SchedulingValidation from './cases/SchedulingValidation.vue'
import SchedulingComparison from './cases/SchedulingComparison.vue'
import './cases/scheduling-journey.css'
const emit = defineEmits<{ ready: [] }>()
const stress = results.rows.filter(row => row.scenario === 'steady-short-arrivals')
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
    <p class="eyebrow">Python · Deterministic dispatch · Reproducible experiments</p>
    <h1>Workshop<br>Scheduling Study</h1>
    <p class="hero-description">A shorter average wait can hide a longer wait for one job. Follow the model, dispatch rules and independent checks behind a single-bench scheduling experiment.</p>
    <div class="actions"><a class="button primary" href="#scheduling-build-map">Explore the build journey</a><a class="button secondary" href="#dispatch">Replay a recorded schedule</a></div>
    <div class="case-facts"><div><span>Project</span><strong>Personal project · October 2026</strong></div><div><span>Experiment</span><strong>22 synthetic scenarios · 2 policies</strong></div><div><span>Recorded verification · 9 Oct 2026</span><strong>36 tests · 44 feasible policy runs</strong></div></div>
  </section>
  <SchedulingJourneyMap />
  <section class="case-layout wrap section scheduling-journey">
    <nav class="case-nav scheduling-journey-nav" aria-label="Build journey">
      <div class="scheduling-nav-intro"><strong>Build journey</strong><span>Six stages, with evidence.</span></div>
      <a v-for="(stage, index) in stages" :key="stage.id" :href="'#' + stage.id" :aria-current="currentStage === stage.id ? 'step' : undefined"><span class="scheduling-stage-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ stage.label }}</span></a>
    </nav>
    <div class="case-content">
      <section id="question" class="scheduling-stage">
        <p class="eyebrow">01 / Frame the question</p><h2>Whose waiting time improves?</h2>
        <p>In a fictional workshop, a long test can hold up many short ones. Choosing short jobs first may lower the average wait, but the average alone cannot tell you whether every job benefits.</p>
        <dl class="scheduling-brief"><div><dt>The question</dt><dd>How does shortest-processing-time dispatch change average and longest waiting time compared with first-come-first-served?</dd></div><div><dt>The comparison</dt><dd>Give both policies identical jobs, release times and changeover constraints.</dd></div><div><dt>Acceptance</dt><dd>Validate every schedule before calculating metrics, then preserve counterexamples alongside favourable results.</dd></div></dl>
        <p class="scheduling-handoff">Define the bench and the clock first. A result is only meaningful inside those assumptions.</p>
        <a class="text-link" href="/evidence/scheduling-development.md">Read the original development log</a>
      </section>
      <section id="model" class="scheduling-stage">
        <p class="eyebrow">02 / Define the model</p><h2>One bench. Known durations. Explicit limits.</h2>
        <p>Each job has an ID, a release minute and a positive processing duration. The bench handles one job at a time, without interruption, with two minutes between jobs.</p>
        <div class="scheduling-verification-grid"><div><h3>Release</h3><p>A job can enter the ready queue only when its release time has arrived. If none is ready, advance the clock to the next release.</p></div><div><h3>Processing</h3><p>Once selected, a job runs for its full known duration. A shorter arrival cannot interrupt it.</p></div><div><h3>Changeover</h3><p>Leave at least two minutes between jobs. Idle time can satisfy that gap; there is no setup before the first job or after the final finish.</p></div></div>
        <details class="scheduling-disclosure"><summary>See the input shape</summary><pre>{
  "id": "long-job",
  "release": 0,
  "duration": 25
}</pre><p class="metadata">The long job from the saved steady-arrival scenario. All times are integer minutes and all jobs are synthetic.</p></details>
        <p class="scheduling-handoff">With the same model in place, only the ready-job selection rule changes.</p>
        <a class="text-link" href="/evidence/scheduling-inputs.json" download>Download the original inputs</a>
      </section>
      <section id="dispatch" class="scheduling-stage">
        <p class="eyebrow">03 / Implement dispatch</p><h2>Same ready queue. A different next job.</h2>
        <p>FCFS selects the earliest release, breaking ties by job ID. SPT selects the shortest ready job, then release time and ID. Neither uses future arrivals or claims a globally optimal schedule.</p>
        <SchedulingDispatch />
        <p class="scheduling-handoff">A plausible timeline is not enough. Check feasibility independently of the code that chose the jobs.</p>
        <a class="text-link" href="/evidence/scheduling-timelines.json" download>Inspect all 44 saved schedules</a>
      </section>
      <section id="validation" class="scheduling-stage">
        <p class="eyebrow">04 / Validate independently</p><h2>A bad schedule must not earn a good score.</h2>
        <p>The validator checks coverage, integer times, release, duration and non-overlap including changeover. It does not call the dispatch implementation. Any violation causes the metrics function to reject the schedule.</p>
        <SchedulingValidation />
        <p class="scheduling-handoff">The original tests include corrupted schedules, invalid inputs, known answers and repeatability checks for every experimental input.</p>
      </section>
      <section id="comparison" class="scheduling-stage">
        <p class="eyebrow">05 / Compare the experiments</p><h2>Keep the trade-off in the result.</h2>
        <p>Twenty fixed seeds generate 30 mixed-arrival jobs each. Two deterministic scenarios add steady short arrivals and a sparse queue. Both policies receive identical inputs in all 22 scenarios.</p>
        <SchedulingComparison />
        <div class="table-scroll"><table><caption>Saved counterexample: steady short arrivals · 32 jobs</caption><thead><tr><th>Policy</th><th>Mean wait (min)</th><th>Longest wait (min)</th><th>Finish (min)</th></tr></thead><tbody><tr v-for="row in stress" :key="row.policy"><th>{{ row.policy.toUpperCase() }}</th><td>{{ row.mean_wait_min.toFixed(2) }}</td><td>{{ row.max_wait_min }}</td><td>{{ row.finish_min }}</td></tr></tbody></table></div>
        <p>The long job starts at minute 0 with FCFS and minute 93 with SPT. Both schedules finish at minute 118. An ageing rule might address the delay, but it has not been implemented or evaluated in this version.</p>
        <details class="scheduling-disclosure"><summary>See the original 22-scenario chart</summary><figure><img src="/media/waiting-time-comparison.png" alt="Original scatterplots compare average and longest waits under FCFS and SPT across 22 synthetic scenarios. The steady-arrival case has a longer maximum wait under SPT." loading="lazy" width="1920" height="800"><figcaption>Actual experiment output. Below the diagonal means less waiting under SPT; above means more. The orange diamond preserves the steady-arrival trade-off.</figcaption></figure></details>
        <div class="stats"><div><strong>36</strong><span>tests in the original verification</span></div><div><strong>44</strong><span>feasible recorded policy runs</span></div><div><strong>0</strong><span>observed constraint violations</span></div></div>
        <p>Recorded on 9 October 2026 (UTC+8), using Windows and Python 3.12.14. Each dispatch was timed 50 times; the median compute time is saved separately from simulated waiting minutes. These measurements describe that machine, not production performance.</p>
      </section>
      <section id="reproduce" class="scheduling-stage">
        <p class="eyebrow">06 / Package reproducibility</p><h2>Keep the inputs, not just the headline.</h2>
        <p>The experiment saves every input and complete schedule alongside metrics, source identity, environment versions and charts. Another reader can inspect the same jobs and reproduce the comparison.</p>
        <div class="scheduling-files"><a href="/evidence/scheduling-inputs.json" download><strong>inputs.json</strong><span>Jobs, release times and durations</span></a><a href="/evidence/scheduling-timelines.json" download><strong>timelines.json</strong><span>Every dispatch, start and finish</span></a><a href="/evidence/scheduling-results.json" download><strong>results.json</strong><span>Metrics, timings and provenance</span></a></div>
        <div class="actions"><a class="text-link" href="/evidence/scheduling-results.csv" download>Download results CSV</a><a class="text-link" href="/downloads/scheduling-simulation-study.zip" download>Download source and full schedules</a></div>
        <h3>Reproduce the experiment</h3><pre>python -m pip install -r requirements-dev.txt
python -m pytest -q
python experiment.py</pre>
        <p>Run from the extracted source directory with Python 3.12. The standard library provides scheduling and validation; Matplotlib produces the chart. Running the experiment replaces its generated results, so keep the downloaded evidence if you want to compare runs.</p>
        <a class="text-link" href="/evidence/scheduling-readme.md">Read the reproduction instructions</a>
        <h3>Scope and contribution</h3><p>The project covers problem definition, deterministic dispatch policies, an independent validator, tests and the experiment pipeline. It uses a new workshop scenario and synthetic inputs; no earlier university code or historical optimisation results were reused.</p>
        <p>The model excludes breakdowns, travel, operator availability, uncertain durations, deadlines and multiple benches. No operational savings are claimed. The six stages group the documented process; the animations explain saved schedules or clearly labelled test examples.</p>
        <p class="metadata">Captured {{ results.executed_at_utc }} · Source {{ results.source_sha256.slice(0, 12) }} · {{ results.environment.platform }} / Python {{ results.environment.python }}</p>
      </section>
    </div>
  </section>
</template>
