import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const WARP_RATES = [1, 60, 600] as const
export type WarpRate = (typeof WARP_RATES)[number]

/** 관제 화면이 공유하는 임무 시계. 실제 시각에서 시작해 배속으로 앞당길 수 있습니다. */
export const useMissionClock = defineStore('mission-clock', () => {
  const now = ref(new Date())
  const rate = ref<WarpRate>(1)
  const paused = ref(false)
  const offsetMs = ref(0)

  let timer: ReturnType<typeof setInterval> | undefined
  let subscribers = 0
  let last = Date.now()

  function tick(): void {
    const real = Date.now()
    const delta = real - last
    last = real
    if (!paused.value) offsetMs.value += delta * (rate.value - 1)
    else offsetMs.value -= delta
    now.value = new Date(real + offsetMs.value)
  }

  function start(): void {
    subscribers += 1
    if (timer) return
    last = Date.now()
    timer = setInterval(tick, 250)
  }

  function stop(): void {
    subscribers = Math.max(0, subscribers - 1)
    if (subscribers === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function setRate(next: WarpRate): void {
    rate.value = next
    paused.value = false
  }

  function togglePaused(): void {
    paused.value = !paused.value
  }

  function reset(): void {
    offsetMs.value = 0
    rate.value = 1
    paused.value = false
    last = Date.now()
    now.value = new Date()
  }

  const isLive = computed(() => !paused.value && rate.value === 1 && Math.abs(offsetMs.value) < 2000)

  return { now, rate, paused, isLive, tick, start, stop, setRate, togglePaused, reset }
})
