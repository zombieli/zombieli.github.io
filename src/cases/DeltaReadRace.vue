<script setup lang="ts">
import { computed, ref } from 'vue'
import { raceFrames, type RaceScenario, type ReadSlot } from '../lib/delta-journey'
import { useDeltaPlayback } from '../lib/delta-motion'
const scenario = ref<RaceScenario>('stale')
const frames = computed(() => raceFrames(scenario.value))
const { index, playing, reduced, pulse, version, stop, select, replay } = useDeltaPlayback(() => frames.value.length)
const current = computed(() => frames.value[index.value]!)
const slots: ReadSlot[] = ['baseline', 'candidate']
function choose(next: RaceScenario) { stop(); scenario.value = next; select(0) }
</script>

<template>
  <div class="delta-demo" data-testid="delta-race" :data-playing="playing">
    <div class="delta-demo-heading"><p>Interactive failure replay · browser input state</p><h3>Let the newest selection win.</h3></div>
    <div class="delta-options" role="group" aria-label="File-read scenario"><button type="button" :aria-pressed="scenario === 'stale'" @click="choose('stale')">Old read finishes late</button><button type="button" :aria-pressed="scenario === 'independent'" @click="choose('independent')">Independent sample reads</button></div>
    <div class="delta-race-steps" role="group" aria-label="Read events"><button v-for="(frame, position) in frames" :key="frame.title" type="button" :aria-label="`Inspect event ${position + 1}: ${frame.title}`" :aria-pressed="index === position" :data-race-step="position" @click="select(position)">{{ position + 1 }}</button></div>
    <div class="delta-race-board" :key="version" :class="{ 'is-tracing': pulse, 'is-ignored': current.ignored }"><div v-for="slot in slots" :key="slot" class="delta-race-slot" :class="{ selected: current.lane === slot }" :data-slot="slot"><div><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 4h19l9 9v31H10z M29 4v10h9 M17 23h14 M17 31h10" /></svg><h4>{{ slot === 'baseline' ? 'Baseline slot' : 'Candidate slot' }}</h4><span class="delta-token">Token {{ current.state.tokens[slot] }}</span></div><strong>{{ current.state.loading[slot] ? 'Reading…' : current.state.errors[slot] ? 'Report rejected' : current.state.reports[slot]?.label ?? 'No report' }}</strong><p>{{ current.state.errors[slot] || (current.state.reports[slot] ? 'Valid report available' : 'Waiting for a valid report') }}</p></div><div class="delta-race-bridge" aria-hidden="true"><svg viewBox="0 0 260 50"><path class="delta-trace" d="M20 0v18h110v30 M240 0v18H130" /><path v-if="current.ignored" d="M191 9l18 18 M209 9l-18 18" /></svg></div><div class="delta-race-result" :class="{ selected: current.lane === 'result' }"><span>Comparison artifact</span><strong data-testid="delta-race-verdict">{{ current.state.result?.verdict ?? 'No verdict' }}</strong><span data-testid="delta-race-download">{{ current.state.result ? 'Download available' : 'Download unavailable' }}</span></div></div>
    <div class="delta-explanation" :aria-live="playing ? 'off' : 'polite'"><span class="delta-kicker">Event {{ index + 1 }} / {{ frames.length }}{{ current.ignored ? ' · stale result ignored' : '' }}</span><h4 data-testid="delta-race-event">{{ current.title }}</h4><p>{{ current.detail }}</p></div>
    <div class="delta-controls"><button type="button" @click="playing ? stop() : replay()">{{ playing ? 'Pause reads' : 'Replay reads' }}</button><button type="button" :disabled="index === 0" @click="select(index - 1)">Previous event</button><button type="button" :disabled="index === frames.length - 1" @click="select(index + 1)">Next event</button></div>
    <p class="delta-demo-note">{{ reduced ? 'Reduced motion: inspect events manually. ' : 'Replay timing is illustrative. ' }}This in-memory model follows the original per-slot token checks; it does not read files. The standalone demo and historical browser tests exercise real asynchronous replacement.</p>
  </div>
</template>
