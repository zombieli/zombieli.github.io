import { onMounted, onUnmounted, ref } from 'vue'

export const journeyStepDuration = 1200
export const journeyFeedbackDuration = 650

/** All case diagrams use explicit replay, bounded feedback and the same stop rules. */
export function useJourneyPlayback(length: () => number, initial = 0, feedbackDuration = journeyFeedbackDuration) {
  const index = ref(initial)
  const playing = ref(false)
  const reduced = ref(true)
  const pulse = ref(false)
  const version = ref(0)
  let stepTimer: number | undefined
  let pulseTimer: number | undefined
  let motion: MediaQueryList | undefined

  function stop() {
    window.clearTimeout(stepTimer)
    window.clearTimeout(pulseTimer)
    stepTimer = pulseTimer = undefined
    playing.value = pulse.value = false
  }

  function highlight() {
    window.clearTimeout(pulseTimer)
    version.value++
    pulse.value = !reduced.value && !document.hidden
    if (pulse.value) pulseTimer = window.setTimeout(() => { pulse.value = false }, feedbackDuration)
  }

  function select(next: number) {
    stop()
    index.value = Math.max(0, Math.min(Math.max(0, length() - 1), next))
    highlight()
  }

  function advance() {
    stepTimer = window.setTimeout(() => {
      index.value = Math.min(index.value + 1, Math.max(0, length() - 1))
      highlight()
      if (index.value < length() - 1) advance()
      else playing.value = false
    }, journeyStepDuration)
  }

  function replay() {
    select(0)
    if (!reduced.value && !document.hidden && length() > 1) {
      playing.value = true
      advance()
    }
  }

  function preference() {
    reduced.value = motion?.matches ?? true
    if (reduced.value) stop()
  }

  function visibility() { if (document.hidden) stop() }

  onMounted(() => {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    preference()
    motion.addEventListener('change', preference)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', stop)
  })
  onUnmounted(() => {
    stop()
    motion?.removeEventListener('change', preference)
    document.removeEventListener('visibilitychange', visibility)
    window.removeEventListener('pagehide', stop)
  })
  return { index, playing, reduced, pulse, version, stop, select, replay, highlight }
}
