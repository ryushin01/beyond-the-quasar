<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { scaleLinear, scaleLog } from 'd3-scale'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ORBITS, countBy, type Satellite } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'
import { formatNumber } from '@/shared/lib'

const props = defineProps<{ satellites: Satellite[] }>()
const emit = defineEmits<{ open: [satellite: Satellite] }>()

const { t } = useI18n()
const store = useSatelliteFilter()

// 좌표를 화면 픽셀에 맞춰 좁은 화면에서도 글자가 줄어들지 않게 합니다.
const plot = ref<HTMLElement>()
const { width: plotWidth } = useElementSize(plot)
const WIDTH = computed(() => Math.round(plotWidth.value) || 900)
const narrow = computed(() => WIDTH.value < 600)
const HEIGHT = computed(() => (narrow.value ? 380 : 480))
const PAD = { top: 16, right: 16, bottom: 44, left: 60 }
const HIT_RADIUS = 28
const GEO_KM = 35786

const x = computed(() => scaleLinear().domain([0, 150]).range([PAD.left, WIDTH.value - PAD.right]))
const y = computed(() => scaleLog().domain([200, 200_000]).range([HEIGHT.value - PAD.bottom, PAD.top]).clamp(true))
const xTicks = [0, 30, 60, 90, 120, 150]
const yTicks = computed(() => (narrow.value ? [200, 1000, 10_000, 100_000] : [200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000, 200_000]))

const visibleIds = computed(() => new Set(store.apply(props.satellites).map((satellite) => satellite.noradId)))

const points = computed(() =>
  props.satellites.flatMap((satellite, index) => {
    const { apogeeKm, perigeeKm, inclinationDeg } = satellite
    if (apogeeKm === null || perigeeKm === null || inclinationDeg === null) return []
    return [
      {
        satellite,
        index,
        x: x.value(inclinationDeg),
        y: y.value((apogeeKm + perigeeKm) / 2),
        // 타원 궤도는 근지점과 원지점 사이를 선으로 함께 보여 줍니다.
        top: y.value(apogeeKm),
        bottom: y.value(perigeeKm),
        military: satellite.category === 'military',
        shown: visibleIds.value.has(satellite.noradId),
      },
    ]
  }),
)

const hovered = ref<(typeof points.value)[number] | null>(null)
const svg = ref<SVGSVGElement>()

/** 작은 점을 정확히 겨누지 않아도 되도록 포인터에서 가장 가까운 위성을 고릅니다(KWCAG 6.1.3). */
function nearest(event: PointerEvent | MouseEvent) {
  const box = svg.value?.getBoundingClientRect()
  if (!box?.width) return null
  const px = ((event.clientX - box.left) / box.width) * WIDTH.value
  const py = ((event.clientY - box.top) / box.height) * HEIGHT.value
  let best: (typeof points.value)[number] | null = null
  let bestDistance = HIT_RADIUS
  for (const point of points.value) {
    if (!point.shown) continue
    const distance = Math.hypot(point.x - px, point.y - py)
    if (distance < bestDistance) {
      best = point
      bestDistance = distance
    }
  }
  return best
}

function onClick(event: MouseEvent): void {
  const point = nearest(event)
  if (point) emit('open', point.satellite)
}

const tooltipStyle = computed(() => {
  if (!hovered.value) return {}
  const left = (hovered.value.x / WIDTH.value) * 100
  const top = (hovered.value.y / HEIGHT.value) * 100
  return { left: `${left}%`, top: `${top}%`, transform: `translate(${left > 60 ? 'calc(-100% - 12px)' : '12px'}, ${top > 70 ? 'calc(-100% - 8px)' : '8px'})` }
})

const orbitCounts = computed(() => countBy(store.apply(props.satellites), (satellite) => satellite.orbit))
const summary = computed(() =>
  t('orbitMap.summary', {
    n: visibleIds.value.size,
    list: ORBITS.map((orbit) => `${orbit} ${orbitCounts.value.get(orbit) ?? 0}`).join(', '),
  }),
)
</script>

<template>
  <figure class="scatter">
    <figcaption class="sr-only">{{ summary }}</figcaption>
    <div ref="plot" class="scatter__plot">
      <svg
        ref="svg"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        role="img"
        :aria-label="summary"
        :class="{ 'scatter__svg--hit': hovered }"
        @pointermove="hovered = nearest($event)"
        @pointerleave="hovered = null"
        @click="onClick"
      >
        <g class="scatter__grid">
          <line v-for="tick in yTicks" :key="`y${tick}`" :x1="PAD.left" :x2="WIDTH - PAD.right" :y1="y(tick)" :y2="y(tick)" />
          <line v-for="tick in xTicks" :key="`x${tick}`" :y1="PAD.top" :y2="HEIGHT - PAD.bottom" :x1="x(tick)" :x2="x(tick)" />
        </g>
        <g class="scatter__axis">
          <text v-for="tick in yTicks" :key="`yl${tick}`" :x="PAD.left - 8" :y="y(tick) + 4" text-anchor="end">{{ formatNumber(tick) }}</text>
          <text v-for="tick in xTicks" :key="`xl${tick}`" :x="x(tick)" :y="HEIGHT - PAD.bottom + 18" text-anchor="middle">{{ tick }}°</text>
          <text :x="WIDTH - PAD.right" :y="HEIGHT - 6" text-anchor="end">{{ t('orbitMap.axisInclination') }}</text>
          <text :x="PAD.left" :y="HEIGHT - 6" text-anchor="start">{{ t('orbitMap.axisAltitude') }}</text>
        </g>
        <g class="scatter__ref">
          <line :x1="PAD.left" :x2="WIDTH - PAD.right" :y1="y(GEO_KM)" :y2="y(GEO_KM)" />
          <text :x="WIDTH - PAD.right - 4" :y="y(GEO_KM) - 6" text-anchor="end">{{ t('orbitMap.geoBelt') }}</text>
          <line :x1="PAD.left" :x2="WIDTH - PAD.right" :y1="y(2000)" :y2="y(2000)" />
          <text :x="WIDTH - PAD.right - 4" :y="y(2000) + 14" text-anchor="end">{{ t('orbitMap.leoLimit') }}</text>
        </g>
        <g
          v-for="point in points"
          :key="point.satellite.noradId"
          class="scatter__point"
          :class="{ 'scatter__point--mil': point.military, 'scatter__point--dim': !point.shown, 'scatter__point--on': hovered?.satellite.noradId === point.satellite.noradId }"
          :style="{ '--i': point.index }"
        >
          <line v-if="point.bottom - point.top > 12" class="scatter__span" :x1="point.x" :x2="point.x" :y1="point.top" :y2="point.bottom" />
          <path
            class="scatter__mark"
            :transform="`translate(${point.x} ${point.y})`"
            :d="point.military ? 'M0 -6.5 6.5 0 0 6.5 -6.5 0Z' : 'M-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0'"
          />
        </g>
      </svg>
      <div v-if="hovered" class="scatter__tip" :style="tooltipStyle" aria-hidden="true">
        <strong>{{ hovered.satellite.name }}</strong>
        <span>{{ t(`missions.${hovered.satellite.mission}`) }}</span>
        <span>{{ formatNumber(hovered.satellite.inclinationDeg, 1) }}° · {{ formatNumber(hovered.satellite.perigeeKm) }}–{{ formatNumber(hovered.satellite.apogeeKm) }} km</span>
      </div>
    </div>
    <div class="scatter__legend">
      <span><i class="scatter__key scatter__key--mil" aria-hidden="true" />{{ t('control.legendMilitary') }}</span>
      <span><i class="scatter__key" aria-hidden="true" />{{ t('control.legendOther') }}</span>
      <span class="scatter__hint">{{ t('orbitMap.hint') }}</span>
    </div>
  </figure>
</template>

<style scoped>
.scatter {
  margin: 0;
}
.scatter__plot {
  position: relative;
  border: 1px solid var(--line);
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
.scatter__svg--hit {
  cursor: pointer;
}
.scatter__grid line {
  stroke: var(--line);
  stroke-width: 1;
}
.scatter__axis text,
.scatter__ref text {
  fill: var(--muted);
  font: 400 12px var(--font-mono);
}
.scatter__ref line {
  stroke: var(--line-strong);
  stroke-dasharray: 2 5;
}
.scatter__mark {
  fill: var(--signal-text);
  transition: opacity 0.35s ease;
  animation: scatter-in 0.7s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 5ms);
}
.scatter__span {
  stroke: var(--signal-text);
  stroke-opacity: 0.45;
  transition: opacity 0.35s ease;
}
.scatter__point--mil .scatter__mark {
  fill: var(--alert);
}
.scatter__point--mil .scatter__span {
  stroke: var(--alert);
}
.scatter__point--dim .scatter__mark,
.scatter__point--dim .scatter__span {
  opacity: 0.12;
}
.scatter__point--on .scatter__mark {
  stroke: var(--ink);
  stroke-width: 2;
}
@keyframes scatter-in {
  from {
    opacity: 0;
  }
}
.scatter__tip {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  max-width: 16rem;
  padding: 0.5rem 0.625rem;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.75rem;
  pointer-events: none;
}
.scatter__tip strong {
  font-size: 0.8125rem;
}
.scatter__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}
.scatter__legend > span {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.scatter__key {
  display: inline-block;
  width: 0.625rem;
  height: 0.625rem;
  background: var(--signal-text);
  border-radius: 50%;
}
.scatter__key--mil {
  background: var(--alert);
  border-radius: 0;
  transform: rotate(45deg);
}
.scatter__hint {
  color: var(--muted);
}
</style>
