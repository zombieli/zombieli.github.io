<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJourneyPlayback, journeyStepDuration } from '../lib/journey-motion'
import { getDispatchContext, recordedPlayback, type SchedulingPolicy } from '../lib/scheduling-playback'
import './scheduling-dispatch.css'

const scenarioName = ref('steady-short-arrivals')
const policy = ref<SchedulingPolicy>('fcfs')
const { index, playing, reduced: reducedMotion, stop: pause, select, replay } = useJourneyPlayback(() => schedule.value.slots.length)
const scenario = computed(() => recordedPlayback.scenarios.find(item => item.name === scenarioName.value)!)
const schedule = computed(() => scenario.value.policies[policy.value])
const context = computed(() => getDispatchContext(scenario.value, policy.value, index.value))
const finish = computed(() => Math.max(...(['fcfs', 'spt'] as const).map(item => scenario.value.policies[item].metrics.finish_min)))
const policies: SchedulingPolicy[] = ['fcfs', 'spt']
const names: Record<string, string> = { 'steady-short-arrivals': 'Steady short arrivals · 32 jobs', 'sparse-arrivals': 'Sparse arrivals · 12 jobs', 'mixed-00': 'Mixed arrivals · seed 0 · 30 jobs' }
const selectedJob = computed({ get: () => context.value.job.id, set: (id: string) => inspectJob(id) })
const duration = journeyStepDuration
function choosePolicy(next: SchedulingPolicy) { pause(); policy.value = next; index.value = 0 }
function changeScenario() { pause(); index.value = 0 }
function inspectJob(id: string) { const next = schedule.value.slots.findIndex(slot => slot.job_id === id); if (next >= 0) select(next) }
function step(change: number) { select(index.value + change) }
</script>

<template>
  <div class="scheduling-dispatch" data-testid="scheduling-dispatch" :data-playing="String(playing)">
    <div class="dispatch-heading"><p>Saved synthetic schedules</p><h3>Watch the next job change.</h3></div>
    <div class="dispatch-selection"><div><label for="dispatch-scenario">Recorded scenario</label><select id="dispatch-scenario" v-model="scenarioName" @change="changeScenario"><option v-for="item in recordedPlayback.scenarios" :key="item.name" :value="item.name">{{ names[item.name] }}</option></select></div><div class="dispatch-policies" role="group" aria-label="Dispatch policy"><button v-for="item in policies" :key="item" type="button" :data-policy="item" :aria-pressed="policy === item" @click="choosePolicy(item)">{{ item.toUpperCase() }}</button></div></div>
    <p class="dispatch-rule">{{ policy === 'fcfs' ? 'FCFS chooses the earliest release among ready jobs, then job ID.' : 'SPT chooses the shortest ready job, then release time and job ID.' }} Future arrivals cannot be selected.</p>
    <div class="dispatch-chart" :class="{ 'is-playing': playing }">
      <div v-for="item in policies" :key="item" class="dispatch-lane" :class="{ 'is-selected': policy === item }">
        <button type="button" class="dispatch-lane-label" :aria-label="`Explore ${item.toUpperCase()} schedule`" :aria-pressed="policy === item" @click="choosePolicy(item)">{{ item.toUpperCase() }}</button>
        <div class="dispatch-lane-track" role="img" :aria-label="`${item.toUpperCase()} saved schedule, ${scenario.jobs.length} jobs, finishes at minute ${scenario.policies[item].metrics.finish_min}. Selected job ${context.job.id} highlighted.`">
          <span v-for="slot in scenario.policies[item].slots" :key="slot.job_id" class="dispatch-job-bar" :class="{ 'is-long': slot.job_id === 'long-job', 'is-inspected': slot.job_id === context.job.id }" :style="{ left: `${slot.start / finish * 100}%`, width: `${(slot.end - slot.start) / finish * 100}%` }" />
          <span class="dispatch-cursor" :style="{ left: `${context.slot.start / finish * 100}%` }" aria-hidden="true" />
        </div>
      </div>
      <div class="dispatch-axis" aria-hidden="true"><span>0</span><span>{{ Math.round(finish / 2) }} min</span><span>{{ finish }}</span></div>
      <p class="dispatch-chart-key"><span class="dispatch-key-item"><span class="dispatch-key-job" />Job duration</span><span v-if="scenarioName === 'steady-short-arrivals'" class="dispatch-key-item"><span class="dispatch-key-long" />Long job</span><span class="dispatch-key-item"><span class="dispatch-key-cursor" />Selected dispatch time</span></p>
      <p class="dispatch-chart-note">Both lanes show the complete saved result. Blank space includes the 2-minute changeover and any idle time.</p>
    </div>
    <div class="dispatch-playback"><button type="button" @click="playing ? pause() : replay()">{{ playing ? 'Pause schedule' : 'Replay schedule' }}</button><button type="button" :disabled="index === 0" @click="step(-1)">Previous dispatch</button><button type="button" :disabled="index === schedule.slots.length - 1" @click="step(1)">Next dispatch</button></div>
    <div class="dispatch-inspect"><div><label for="dispatch-job">Inspect job</label><select id="dispatch-job" v-model="selectedJob"><option v-for="(slot, position) in schedule.slots" :key="slot.job_id" :value="slot.job_id">{{ position + 1 }}. {{ slot.job_id }}</option></select></div><button v-if="scenarioName === 'steady-short-arrivals'" type="button" @click="inspectJob('long-job')">Inspect long job</button></div>
    <div class="dispatch-detail" :aria-live="playing ? 'off' : 'polite'" aria-atomic="true">
      <p class="dispatch-position">{{ policy.toUpperCase() }} · Dispatch <span data-dispatch-index>{{ index + 1 }}</span> of {{ schedule.slots.length }}</p>
      <h4 data-job-id>{{ context.job.id }}</h4>
      <dl class="dispatch-job-facts"><div><dt>Release (min)</dt><dd data-job-release>{{ context.job.release }}</dd></div><div><dt>Start (min)</dt><dd data-job-start>{{ context.slot.start }}</dd></div><div><dt>End (min)</dt><dd data-job-end>{{ context.slot.end }}</dd></div><div><dt>Wait (min)</dt><dd data-job-wait>{{ context.wait }}</dd></div></dl>
      <div class="dispatch-queue-counts"><p><strong data-ready-count>{{ context.ready.length }}</strong> ready, including this job</p><p><strong data-future-count>{{ context.future.length }}</strong> not released yet</p></div>
      <p v-if="context.idleMinutes > 0" class="dispatch-idle">The bench is available at minute {{ context.availableAt }}, but no pending job is ready. The clock advances {{ context.idleMinutes }} minutes to the next release.</p>
      <p v-else class="dispatch-idle">{{ index === 0 ? 'No initial changeover is added. Selection begins with the jobs already released.' : 'The previous job has finished and the 2-minute changeover is complete.' }}</p>
    </div>
    <details class="dispatch-ready"><summary>Inspect the ready jobs at this dispatch</summary><p>Ordered by the selected policy. Clicking a job jumps to its saved dispatch; it does not change the schedule.</p><div class="dispatch-ready-jobs"><button v-for="job in context.ready" :key="job.id" type="button" :aria-pressed="job.id === context.job.id" @click="inspectJob(job.id)"><strong>{{ job.id }}</strong><span>{{ job.duration }} min · released {{ job.release }}</span></button></div></details>
    <p class="dispatch-note">{{ reducedMotion ? 'Reduced motion is on; use the job selector or step buttons. ' : 'Playback uses a compressed, illustrative pace. ' }}This replays saved experiment data, not a live simulation. Minute values and job order remain unchanged.</p>
    <a class="text-link dispatch-evidence" href="/evidence/scheduling-timelines.json" download>Download complete recorded schedules</a>
  </div>
</template>
