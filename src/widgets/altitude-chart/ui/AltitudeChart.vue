<script setup lang="ts">
import { scaleLinear, scaleUtc } from 'd3-scale'
import { line } from 'd3-shape'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { altitudeCurve, nightBrief, type DeepSkyTarget } from '@/entities/sky'
import { formatUtc } from '@/shared/lib'
import { gsap, useMotionPreference } from '@/shared/motion'

const props = defineProps<{ target: DeepSkyTarget; from: Date }>()

const { t } = useI18n()
const observer = useObserver()
const { enabled } = useMotionPreference()
const curvePath = ref<SVGPathElement>()

const WIDTH = 720
const HEIGHT = 260
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }

// 15분 단위로 묶어 슬라이더를 움직일 때마다 다시 계산하지 않습니다.
const startMs = computed(() => Math.floor(props.from.getTime() / 900_000) * 900_000)
const points = computed(() => altitudeCurve(props.target.ra, props.target.dec, observer.site, new Date(startMs.value), { hours: 16, stepMin: 10 }))
const x = computed(() => scaleUtc().domain([new Date(startMs.value), new Date(startMs.value + 16 * 3_600_000)]).range([PAD.left, WIDTH - PAD.right]))
const y = scaleLinear().domain([-30, 90]).range([HEIGHT - PAD.bottom, PAD.top])

const path = computed(() => line<{ date: Date; altitude: number }>().x((point) => x.value(point.date)).y((point) => y(point.altitude))(points.value) ?? '')
const peak = computed(() => points.value.reduce((best, point) => (point.altitude > best.altitude ? point : best), points.value[0]!))

const night = computed(() => {
  const brief = nightBrief(new Date(startMs.value), observer.site)
  if (!brief.duskAstronomical || !brief.dawnAstronomical) return null
  const start = Math.max(x.value(brief.duskAstronomical), PAD.left)
  const end = Math.min(x.value(brief.dawnAstronomical), WIDTH - PAD.right)
  return end > start ? { x: start, width: end - start } : null
})

const xTicks = computed(() => x.value.ticks(6).map((tick) => ({ x: x.value(tick), label: `${String(tick.getUTCHours()).padStart(2, '0')}Z` })))
const yTicks = [0, 30, 60, 90]

const summary = computed(() =>
  t('a11y.chartSummary', { name: props.target.name, max: Math.round(peak.value.altitude), time: formatUtc(peak.value.date) }),
)

function animate(): void {
  const element = curvePath.value
  if (!element || !enabled.value || typeof element.getTotalLength !== 'function') return
  const length = element.getTotalLength()
  gsap.fromTo(element, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.1, ease: 'expo.out', clearProps: 'strokeDasharray,strokeDashoffset' })
}

onMounted(animate)
watch(() => props.target.id, () => nextTick(animate))
</script>

<template>
  <figure class="chart">
    <figcaption class="sr-only">{{ summary }}</figcaption>
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" aria-hidden="true">
      <rect v-if="night" :x="night.x" :y="PAD.top" :width="night.width" :height="HEIGHT - PAD.top - PAD.bottom" fill="var(--raised)" />
      <g v-for="tick in yTicks" :key="tick">
        <line :x1="PAD.left" :x2="WIDTH - PAD.right" :y1="y(tick)" :y2="y(tick)" :stroke="tick === 0 ? 'var(--line-strong)' : 'var(--line)'" />
        <text :x="PAD.left - 8" :y="y(tick) + 4" text-anchor="end" class="chart__tick">{{ tick }}°</text>
      </g>
      <g v-for="tick in xTicks" :key="tick.x">
        <line :x1="tick.x" :x2="tick.x" :y1="HEIGHT - PAD.bottom" :y2="HEIGHT - PAD.bottom + 5" stroke="var(--line-strong)" />
        <text :x="tick.x" :y="HEIGHT - 8" text-anchor="middle" class="chart__tick">{{ tick.label }}</text>
      </g>
      <path ref="curvePath" :d="path" fill="none" stroke="var(--signal-text)" stroke-width="2" />
      <g :transform="`translate(${x(peak.date)} ${y(peak.altitude)})`">
        <circle r="4" fill="var(--ink)" />
        <text y="-10" text-anchor="middle" class="chart__peak">{{ Math.round(peak.altitude) }}°</text>
      </g>
    </svg>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}
.chart svg {
  display: block;
  width: 100%;
  height: auto;
}
.chart__tick {
  fill: var(--muted);
  font: 400 11px var(--font-mono);
}
.chart__peak {
  fill: var(--ink);
  font: 600 13px var(--font-mono);
}
</style>
