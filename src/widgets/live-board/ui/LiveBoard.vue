<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { SITES } from '@/entities/observer'
import { lookAngleAt, stateAt, toSatrec, type Satellite } from '@/entities/satellite'
import { moonInfo } from '@/entities/sky'
import { formatNumber } from '@/shared/lib'
import { EASE, gsap, useMotionPreference } from '@/shared/motion'

const props = defineProps<{ satellites: Satellite[] }>()

const { t } = useI18n()
const clock = useMissionClock()
const { enabled } = useMotionPreference()
const root = ref<HTMLElement>()

const DAEJEON = SITES[0]!
const ISS_ID = 25544

const iss = computed(() => {
  const satellite = props.satellites.find((item) => item.noradId === ISS_ID)
  return satellite ? stateAt(toSatrec(satellite.line1, satellite.line2), clock.now) : null
})
// 151기의 시선각은 시계 틱마다가 아니라 초 단위로 다시 계산합니다.
const second = computed(() => Math.floor(clock.now.getTime() / 1000))
const above = computed(() => {
  const date = new Date(second.value * 1000)
  return props.satellites.filter((item) => (lookAngleAt(toSatrec(item.line1, item.line2), date, DAEJEON)?.elevation ?? -1) >= 5).length
})
const moon = computed(() => moonInfo(clock.now))

const tiles = computed(() => [
  { key: 'boardTracked', value: formatNumber(props.satellites.length), unit: '' },
  { key: 'boardMilitary', value: formatNumber(props.satellites.filter((item) => item.category === 'military').length), unit: '', alert: true },
  { key: 'boardAbove', value: formatNumber(above.value), unit: '' },
  { key: 'boardIssAlt', value: formatNumber(iss.value?.altitudeKm, 1), unit: 'km' },
  { key: 'boardIssSpeed', value: formatNumber(iss.value?.speedKmS, 2), unit: 'km/s' },
  { key: 'boardMoon', value: formatNumber(moon.value.illumination * 100, 0), unit: '%' },
])

let context: gsap.Context | undefined

function build(): void {
  context?.revert()
  context = undefined
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.from('.board__tile', {
      autoAlpha: 0,
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.9,
      ease: EASE.out,
      stagger: { each: 0.07, from: 'start' },
      clearProps: 'clipPath',
      scrollTrigger: { trigger: root.value, start: 'top 70%' },
    })
  }, root.value)
}

onMounted(() => {
  clock.start()
  watch(enabled, build, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => {
  clock.stop()
  context?.revert()
})
</script>

<template>
  <section ref="root" class="board" aria-labelledby="board-title">
    <header class="board__head">
      <p class="board__eyebrow">{{ t('home.boardEyebrow') }}</p>
      <h2 id="board-title" class="board__title">{{ t('home.boardTitle') }}</h2>
    </header>
    <dl class="board__grid">
      <div v-for="tile in tiles" :key="tile.key" class="board__tile">
        <dt class="board__label">{{ t(`home.${tile.key}`) }}</dt>
        <dd class="board__value" :class="{ 'board__value--alert': tile.alert }">
          {{ tile.value }}<small v-if="tile.unit" class="board__unit">{{ tile.unit }}</small>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.board {
  padding: clamp(4rem, 10vw, 9rem) var(--margin);
  background: var(--paper);
}
.board__head {
  margin-bottom: 2.5rem;
}
.board__eyebrow {
  margin: 0 0 0.5rem;
  color: var(--muted);
  font: 500 0.8125rem var(--font-mono);
}
.board__title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 4.75rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.board__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--line-strong);
  border-left: 1px solid var(--line-strong);
}
@media (max-width: 900px) {
  .board__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .board__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
.board__tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.5rem;
  min-height: 13rem;
  padding: 1.25rem;
  border-right: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
  transition: background-color 0.25s ease, color 0.25s ease;
}
.board__tile:hover {
  background: var(--ink);
  color: var(--paper);
}
.board__label {
  font-size: 0.9375rem;
  font-weight: 600;
}
.board__value {
  margin: 0;
  font: 500 clamp(2.75rem, 6vw, 5.5rem) / 1 var(--font-mono);
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.board__value--alert {
  color: var(--alert);
}
.board__tile:hover .board__value--alert {
  color: inherit;
}
.board__unit {
  margin-left: 0.375rem;
  font-size: 0.25em;
  letter-spacing: 0;
}
</style>
