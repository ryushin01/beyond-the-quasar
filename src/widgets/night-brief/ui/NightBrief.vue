<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { moonInfo, nightBrief } from '@/entities/sky'
import { formatUtc } from '@/shared/lib'

const props = defineProps<{ date: Date }>()

const { t } = useI18n()
const observer = useObserver()

// 시계가 움직여도 10분 단위로만 다시 계산합니다.
const key = computed(() => Math.floor(props.date.getTime() / 600_000))
const brief = computed(() => nightBrief(new Date(key.value * 600_000), observer.site))
const moon = computed(() => moonInfo(new Date(key.value * 600_000)))

const rows = computed(() => [
  { key: 'sunset', value: brief.value.sunset },
  { key: 'dusk', value: brief.value.duskAstronomical },
  { key: 'dawn', value: brief.value.dawnAstronomical },
  { key: 'sunrise', value: brief.value.sunrise },
  { key: 'moonrise', value: brief.value.moonrise },
  { key: 'moonset', value: brief.value.moonset },
])

/** 위상각으로 달의 밝은 면 경로를 만듭니다. (0: 삭, 180: 망) */
const moonPath = computed(() => {
  const angle = (moon.value.phaseAngle * Math.PI) / 180
  const waxing = moon.value.phaseAngle < 180
  const terminator = Math.abs(Math.cos(angle)) * 50
  const gibbous = moon.value.phaseAngle > 90 && moon.value.phaseAngle < 270
  // 차오를 때는 오른쪽이 밝습니다(북반구 기준).
  const outer = waxing ? 1 : 0
  const inner = gibbous === waxing ? 1 : 0
  return `M50 0 A50 50 0 0 ${outer} 50 100 A${terminator} 50 0 0 ${inner} 50 0Z`
})
</script>

<template>
  <div class="brief">
    <div class="brief__moon">
      <svg viewBox="0 0 100 100" class="brief__moon-art" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="var(--raised)" stroke="var(--line-strong)" />
        <path :d="moonPath" fill="var(--ink)" />
      </svg>
      <div>
        <p class="label-mono brief__label">{{ t('observatory.moon') }}</p>
        <p class="brief__phase">{{ t(`moonPhases.${moon.phaseKey}`) }}</p>
        <p class="brief__illum">{{ t('observatory.illumination', { n: Math.round(moon.illumination * 100) }) }}</p>
      </div>
    </div>
    <ul class="brief__tiles">
      <li v-for="row in rows" :key="row.key" class="brief__tile">
        <span class="label-mono">{{ t(`observatory.${row.key}`) }}</span>
        <span class="brief__time">{{ row.value ? formatUtc(row.value).slice(0, 5) + 'Z' : '—' }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.brief {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border-top: 1px solid var(--line);
}
@media (min-width: 720px) {
  .brief {
    grid-template-columns: minmax(16rem, 1fr) 2fr;
  }
}
.brief__moon {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--line);
}
.brief__moon-art {
  flex: none;
  width: 5.5rem;
  height: 5.5rem;
}
.brief__label,
.brief__phase,
.brief__illum {
  margin: 0;
}
.brief__phase {
  font-size: 1.375rem;
  font-weight: 800;
  line-height: 1.2;
}
.brief__illum {
  font: 500 0.8125rem var(--font-mono);
}
.brief__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}
.brief__tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid var(--line);
  border-left: 1px solid var(--line);
  transition: background-color 0.2s ease, color 0.2s ease;
}
.brief__tile:hover {
  background: var(--ink);
  color: var(--paper);
}
.brief__tile:hover .label-mono {
  color: inherit;
}
.brief__time {
  font: 600 clamp(1.25rem, 1.9vw, 1.875rem) var(--font-mono);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
