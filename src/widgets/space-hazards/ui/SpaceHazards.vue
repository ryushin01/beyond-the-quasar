<script setup lang="ts">
import { useElementVisibility, useIntervalFn, useNow } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { estimateDiameterM, toLunarDistances, upcomingApproaches, useCloseApproaches } from '@/entities/asteroid'
import { useSpaceWeather, type ScaleKey } from '@/entities/space-weather'
import { formatNumber } from '@/shared/lib'

const props = withDefaults(defineProps<{ now?: Date; limit?: number }>(), { now: undefined, limit: 6 })

const { t } = useI18n()
const root = ref<HTMLElement>()

// 패널이 화면에 들어온 뒤에만 외부 자료를 받습니다(한 번 들어오면 계속 유지).
const visible = useElementVisibility(root, { rootMargin: '200px' })
const active = ref(false)
watch(visible, (value) => {
  if (value) active.value = true
}, { immediate: true })

// 화면을 열어 둔 채 접근 시각이 지나면 목록에서 빠지도록 1분마다 시각을 갱신합니다(고정 시각을 받으면 그 값을 씀).
const clock = useNow({ scheduler: (tick) => useIntervalFn(tick, 60_000) })
const now = computed(() => props.now ?? clock.value)

const space = useSpaceWeather(active)
const neo = useCloseApproaches(active)

/** NOAA 등급은 0~5이고, 1 이상이면 위성·통신에 영향이 있을 수 있어 앰버로 표시합니다. */
const scales = computed(() => {
  const weather = space.weather.value
  if (!weather) return []
  const today = weather.forecast[0]
  // 예보 값이 없는 날은 G0으로 치지 않습니다. 하나도 없으면 '—'로 보입니다.
  const forecastG = weather.forecast.map((day) => day.g).filter((value): value is number => value !== null)
  const notes: Record<ScaleKey, string> = {
    g: t('hazards.forecastG', { n: forecastG.length ? Math.max(...forecastG) : '—' }),
    s: t('hazards.forecastS', { n: today?.s ?? '—' }),
    r: t('hazards.forecastR', { minor: today?.rMinor ?? '—', major: today?.rMajor ?? '—' }),
  }
  return (['g', 's', 'r'] as const).map((key) => ({ key, level: weather.now[key], note: notes[key] }))
})

/** 지난 24시간(3시간 간격 8개) Kp. 막대 높이는 최대 9 기준이고 5(G1) 이상은 앰버입니다. */
const kp = computed(() => {
  const samples = space.weather.value?.kp.slice(-8) ?? []
  const latest = samples.at(-1) ?? null
  return {
    latest,
    bars: samples.map((sample, index) => ({ x: index * 12, height: Math.max(1, (sample.kp / 9) * 36), storm: sample.kp >= 5 })),
    time: latest ? `${latest.time.toISOString().slice(11, 16)}Z` : '',
  }
})

const approaches = computed(() =>
  upcomingApproaches(neo.approaches.value, now.value, props.limit).map((item) => {
    const lunar = toLunarDistances(item.distanceAu)
    const size = item.absoluteMagnitude === null ? null : estimateDiameterM(item.absoluteMagnitude)
    const iso = item.date.toISOString()
    return {
      ...item,
      when: `${iso.slice(0, 10)} ${iso.slice(11, 16)}Z`,
      lunar,
      // 달보다 가까이 지나가면 앰버로 표시합니다.
      closer: lunar < 1,
      size: size ? `${formatNumber(size.min)}–${formatNumber(size.max)} m` : '—',
    }
  }),
)
// NOAA에 닿지 못해 저장소의 스냅샷을 보여 줄 때의 자료 날짜(UTC)
const weatherSnapshotDate = computed(() => space.snapshotAt.value?.toISOString().slice(0, 10) ?? null)
const snapshotDate = computed(() => neo.fetchedAt.value?.toISOString().slice(0, 10) ?? '—')
</script>

<template>
  <div ref="root" class="hazards">
    <p class="hazards__lead">{{ t('hazards.lead') }}</p>
    <div class="hazards__grid">
      <section class="hazards__weather" aria-labelledby="hazards-weather">
        <h3 id="hazards-weather" class="hazards__h label-mono">{{ t('hazards.weather') }} · NOAA SWPC</h3>
        <p v-if="space.isPending.value" class="hazards__state" role="status">{{ t('hazards.loading') }}</p>
        <div v-else-if="space.isError.value" class="hazards__state" role="alert">
          <p>{{ t('hazards.loadError') }}</p>
          <q-btn outline square no-caps :label="t('hazards.retry')" @click="space.refetch()" />
        </div>
        <template v-else>
        <p v-if="weatherSnapshotDate" class="hazards__offline" role="status">{{ t('hazards.offline', { date: weatherSnapshotDate }) }}</p>
        <ul class="hazards__tiles">
          <li v-for="scale in scales" :key="scale.key" class="hazards__tile">
            <span class="label-mono">{{ t(`hazards.scales.${scale.key}`) }}</span>
            <span class="hazards__value" :class="{ 'hazards__value--alert': scale.level > 0 }">
              {{ scale.key.toUpperCase() }}{{ scale.level }}
              <small class="hazards__level">{{ t(`hazards.levels.${scale.level}`) }}</small>
            </span>
            <span class="hazards__note">{{ scale.note }}</span>
          </li>
          <li v-if="kp.latest" class="hazards__tile">
            <span class="label-mono">{{ t('hazards.kp') }}</span>
            <span class="hazards__value" :class="{ 'hazards__value--alert': kp.latest.kp >= 5 }">{{ formatNumber(kp.latest.kp, 1) }}</span>
            <svg class="hazards__bars" viewBox="0 0 96 40" preserveAspectRatio="none" aria-hidden="true">
              <line class="hazards__threshold" x1="0" x2="96" :y1="40 - (5 / 9) * 36" :y2="40 - (5 / 9) * 36" />
              <rect v-for="bar in kp.bars" :key="bar.x" :x="bar.x + 1" :y="40 - bar.height" width="10" :height="bar.height" :class="{ 'hazards__bar--storm': bar.storm }" class="hazards__bar" />
            </svg>
            <span class="hazards__note">{{ t('hazards.kpNote', { time: kp.time }) }}</span>
          </li>
        </ul>
        </template>
      </section>

      <section class="hazards__neo" aria-labelledby="hazards-neo">
        <h3 id="hazards-neo" class="hazards__h label-mono">{{ t('hazards.neo') }} · NASA/JPL CNEOS</h3>
        <p v-if="neo.isPending.value" class="hazards__state" role="status">{{ t('hazards.loading') }}</p>
        <div v-else-if="neo.isError.value" class="hazards__state" role="alert">
          <p>{{ t('hazards.neoLoadError') }}</p>
          <q-btn outline square no-caps :label="t('hazards.retry')" @click="neo.refetch()" />
        </div>
        <p v-else-if="!approaches.length" class="hazards__state">{{ t('hazards.neoNone', { date: snapshotDate }) }}</p>
        <template v-else>
        <!-- 좁은 화면에서는 표만 가로로 밀리므로, 설명은 표 밖에 보이고 표 안의 설명은 화면 낭독기용으로 둡니다. -->
        <p class="hazards__caption" aria-hidden="true">{{ t('hazards.neoCaption', { date: snapshotDate }) }}</p>
        <div class="hazards__scroll" role="region" tabindex="0" :aria-label="t('hazards.table')">
          <table class="table">
            <caption class="sr-only">{{ t('hazards.neoCaption', { date: snapshotDate }) }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ t('hazards.date') }}</th>
                <th scope="col">{{ t('hazards.name') }}</th>
                <th scope="col">{{ t('hazards.distance') }}</th>
                <th scope="col">{{ t('hazards.velocity') }}</th>
                <th scope="col">{{ t('hazards.size') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in approaches" :key="`${item.designation}-${item.when}`">
                <td>{{ item.when }}</td>
                <th scope="row">{{ item.name }}</th>
                <td :class="{ table__alert: item.closer }">
                  {{ t('hazards.ld', { n: formatNumber(item.lunar, 1) }) }}<span v-if="item.closer" class="sr-only"> ({{ t('hazards.closer') }})</span>
                </td>
                <td>{{ formatNumber(item.velocityKmS, 1) }} km/s</td>
                <td>{{ item.size }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hazards__lead {
  margin: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.hazards__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-top: 1px solid var(--line);
}
@media (min-width: 1000px) {
  .hazards__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  }
  .hazards__neo {
    border-left: 1px solid var(--line);
  }
}
.hazards__h {
  margin: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
  /* Quasar 기본 타이포그래피의 h3 줄 높이(3.125rem)를 쓰지 않습니다. */
  line-height: 1.4;
}
.hazards__state {
  margin: 0;
  padding: 1rem;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.hazards__state p {
  margin: 0 0 0.75rem;
}
.hazards__offline {
  margin: 0;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font: 500 0.75rem/1.5 var(--font-mono);
}
.hazards__tiles {
  display: grid;
  /* G·S / R·Kp 두 줄 */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}
.hazards__tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--line);
  border-left: 1px solid var(--line);
  transition: background-color 0.2s ease, color 0.2s ease;
}
.hazards__tile:hover {
  background: var(--ink);
  color: var(--paper);
}
.hazards__tile:hover .label-mono {
  color: inherit;
}
.hazards__value {
  font: 600 clamp(1.25rem, 1.9vw, 1.875rem) var(--font-mono);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.hazards__value--alert {
  color: var(--alert);
}
.hazards__level {
  margin-left: 0.375rem;
  font: 500 0.75rem var(--font-mono);
}
.hazards__note {
  font: 500 0.6875rem/1.4 var(--font-mono);
  color: var(--muted);
}
.hazards__tile:hover .hazards__note {
  color: inherit;
}
.hazards__bars {
  width: 100%;
  height: 2.5rem;
}
.hazards__bar {
  fill: var(--signal-text);
}
.hazards__bar--storm {
  fill: var(--alert);
}
.hazards__threshold {
  stroke: var(--line-strong);
  stroke-dasharray: 2 2;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.hazards__caption {
  margin: 0;
  padding: 0.625rem 1rem;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.5;
}
.hazards__scroll {
  overflow-x: auto;
}
.hazards__scroll tbody th {
  white-space: nowrap;
}
</style>
