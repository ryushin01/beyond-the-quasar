<script setup lang="ts">
import { scaleUtc } from 'd3-scale'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { useObserver } from '@/entities/observer'
import { buildPassSchedule, useTracking, useWatchlist, type Pass, type Satellite } from '@/entities/satellite'
import { formatUtc } from '@/shared/lib'

const props = defineProps<{ satellite: Satellite; satellites: Satellite[] }>()

const HOURS = 24
const MAX_ROWS = 10
const STEP_MS = 300_000

const { t } = useI18n()
const clock = useMissionClock()
const observer = useObserver()
const tracking = useTracking()
const watchlist = useWatchlist()

const siteName = computed(() => t(`sites.${observer.siteId}`))

/** 위성 여러 기를 24시간 계산하므로 가상 시각 5분마다만 다시 계산합니다. */
const startMs = computed(() => Math.floor(clock.now.getTime() / STEP_MS) * STEP_MS)
const subjects = computed(() => {
  const watched = props.satellites.filter((item) => watchlist.ids.includes(item.noradId))
  return (watched.some((item) => item.noradId === props.satellite.noradId) ? watched : [props.satellite, ...watched]).slice(0, MAX_ROWS)
})
const rows = computed(() => buildPassSchedule(subjects.value, observer.site, new Date(startMs.value), HOURS))

const scale = computed(() => scaleUtc().domain([new Date(startMs.value), new Date(startMs.value + HOURS * 3_600_000)]).range([0, 100]).clamp(true))
const ticks = computed(() => scale.value.ticks(4).map((tick) => ({ left: scale.value(tick), label: `${String(tick.getUTCHours()).padStart(2, '0')}Z` })))
const nowLeft = computed(() => scale.value(clock.now))

const barStyle = (pass: Pass): Record<string, string> => {
  const left = scale.value(pass.aos)
  return { left: `${left}%`, width: `${Math.max(scale.value(pass.los) - left, 0.5)}%` }
}
const nextLabel = (row: (typeof rows.value)[number]): string => {
  if (!row.next) return t('schedule.none')
  const time = formatUtc(row.next.aos)
  return row.inProgress ? t('schedule.inProgress') : t('schedule.next', { time })
}
</script>

<template>
  <div class="schedule">
    <p class="schedule__caption">{{ t('schedule.caption', { site: siteName }) }}</p>
    <div class="schedule__axis" aria-hidden="true">
      <span v-for="tick in ticks" :key="tick.left" :style="{ left: `${tick.left}%` }">{{ tick.label }}</span>
    </div>
    <ul class="schedule__rows">
      <li v-for="row in rows" :key="row.satellite.noradId" class="schedule__row">
        <button
          type="button"
          class="schedule__name"
          :class="{ 'schedule__name--mil': row.satellite.category === 'military' }"
          :aria-pressed="tracking.trackedId === row.satellite.noradId"
          @click="tracking.trackedId = row.satellite.noradId"
        >
          {{ row.satellite.name }}
        </button>
        <p class="schedule__next">
          <span :class="{ 'schedule__live': row.inProgress }">{{ nextLabel(row) }}</span>
          <span>{{ t('schedule.count', { n: row.passes.length }) }}</span>
        </p>
        <div class="schedule__track" aria-hidden="true">
          <i class="schedule__now" :style="{ left: `${nowLeft}%` }" />
          <i
            v-for="pass in row.passes"
            :key="pass.aos.getTime()"
            class="schedule__bar"
            :class="{ 'schedule__bar--mil': row.satellite.category === 'military' }"
            :style="barStyle(pass)"
          />
        </div>
      </li>
    </ul>
    <p v-if="!watchlist.ids.length" class="schedule__hint">{{ t('schedule.hint') }}</p>
  </div>
</template>

<style scoped>
.schedule__caption {
  margin: 0;
  padding: 0.5rem 1rem;
  color: var(--muted);
  font-size: 0.75rem;
}
.schedule__axis {
  position: relative;
  height: 1.25rem;
  margin: 0 1rem;
  color: var(--muted);
  font: 400 0.6875rem var(--font-mono);
}
.schedule__axis span {
  position: absolute;
  transform: translateX(-50%);
}
.schedule__axis span:first-child {
  transform: none;
}
.schedule__rows {
  margin: 0;
  padding: 0;
  list-style: none;
}
.schedule__row {
  padding: 0.375rem 1rem 0.625rem;
  border-top: 1px solid var(--line);
}
.schedule__name {
  display: block;
  width: 100%;
  min-height: 1.5rem;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--ink);
  font: 600 0.8125rem var(--font-sans);
  text-align: left;
  cursor: pointer;
}
.schedule__name:hover,
.schedule__name[aria-pressed='true'] {
  color: var(--signal-text);
}
.schedule__name--mil::before {
  content: '◆ ';
  color: var(--alert);
}
.schedule__next {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0 0 0.375rem;
  color: var(--muted);
  font: 400 0.6875rem var(--font-mono);
}
.schedule__live {
  color: var(--signal-text);
  font-weight: 600;
}
.schedule__track {
  position: relative;
  height: 0.75rem;
  background: var(--line);
  overflow: hidden;
}
.schedule__bar {
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 2px;
  background: var(--signal-text);
  transform-origin: left;
  animation: schedule-in 0.8s var(--ease-out) backwards;
}
.schedule__bar--mil {
  background: var(--alert);
}
.schedule__now {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 1;
  width: 1px;
  background: var(--ink);
}
.schedule__hint {
  margin: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
  font-size: 0.8125rem;
}
@keyframes schedule-in {
  from {
    transform: scaleX(0);
  }
}
</style>
