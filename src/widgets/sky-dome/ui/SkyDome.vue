<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { lookAngleAt, toSatrec, type Satellite } from '@/entities/satellite'
import { bodyPosition, BRIGHT_STARS, equatorialToHorizontal, PLANETS, projectHorizontal, TARGETS, type SkyBodyName } from '@/entities/sky'
import { formatUtc } from '@/shared/lib'

const props = defineProps<{ date: Date; selectedId: string; satellites: Satellite[] }>()
defineEmits<{ select: [id: string] }>()

const { t } = useI18n()
const observer = useObserver()

const RINGS = [30, 60]
const ringRadius = (altitude: number): number => Math.tan((((90 - altitude) * Math.PI) / 180) / 2)

const stars = computed(() =>
  BRIGHT_STARS.flatMap((star) => {
    const point = projectHorizontal(equatorialToHorizontal(star.ra, star.dec, props.date, observer.site))
    return point ? [{ ...point, name: star.name, r: Math.max(0.0035, 0.015 - star.magnitude * 0.0042), label: star.magnitude < 0.5 }] : []
  }),
)

const bodies = computed(() =>
  (['Sun', 'Moon', ...PLANETS] as SkyBodyName[]).flatMap((name) => {
    const point = projectHorizontal(bodyPosition(name, props.date, observer.site))
    return point ? [{ ...point, name }] : []
  }),
)

const targets = computed(() =>
  TARGETS.flatMap((target) => {
    const point = projectHorizontal(equatorialToHorizontal(target.ra, target.dec, props.date, observer.site))
    return point ? [{ ...point, id: target.id, name: target.name, kind: target.kind }] : []
  }),
)

const overhead = computed(() =>
  props.satellites.flatMap((satellite) => {
    const look = lookAngleAt(toSatrec(satellite.line1, satellite.line2), props.date, observer.site)
    if (!look) return []
    const point = projectHorizontal({ altitude: look.elevation, azimuth: look.azimuth })
    return point ? [{ ...point, id: satellite.noradId, name: satellite.name, military: satellite.category === 'military' }] : []
  }),
)

const summary = computed(() =>
  t('a11y.skySummary', {
    site: t(`sites.${observer.siteId}`),
    time: formatUtc(props.date, true),
    sats: overhead.value.length,
    targets: targets.value.length,
  }),
)
</script>

<template>
  <svg class="dome" viewBox="-1.14 -1.14 2.28 2.28" role="img" :aria-label="summary">
    <defs>
      <radialGradient id="dome-bg">
        <stop offset="0" stop-color="var(--raised)" />
        <stop offset="1" stop-color="var(--paper)" />
      </radialGradient>
    </defs>
    <circle r="1" fill="url(#dome-bg)" stroke="var(--line-strong)" stroke-width="0.004" />
    <circle v-for="ring in RINGS" :key="ring" :r="ringRadius(ring)" class="dome__line" />
    <line x1="-1" x2="1" class="dome__line" />
    <line y1="-1" y2="1" class="dome__line" />
    <g class="dome__labels">
      <text y="-1.05">{{ t('observatory.north') }}</text>
      <text y="1.09">{{ t('observatory.south') }}</text>
      <text x="-1.08" y="0.016">{{ t('observatory.east') }}</text>
      <text x="1.08" y="0.016">{{ t('observatory.west') }}</text>
    </g>

    <g>
      <circle v-for="star in stars" :key="star.name" :cx="star.x" :cy="star.y" :r="star.r" fill="var(--ink)">
        <title>{{ star.name }}</title>
      </circle>
      <template v-for="star in stars" :key="`${star.name}-label`">
        <text v-if="star.label" :x="star.x + 0.022" :y="star.y + 0.01" class="dome__star-label">{{ star.name }}</text>
      </template>
    </g>

    <g>
      <g v-for="satellite in overhead" :key="satellite.id" :transform="`translate(${satellite.x} ${satellite.y})`">
        <rect v-if="satellite.military" x="-0.009" y="-0.009" width="0.018" height="0.018" transform="rotate(45)" fill="var(--alert)" />
        <circle v-else r="0.007" fill="var(--signal-text)" />
        <title>{{ satellite.name }}</title>
      </g>
    </g>

    <g>
      <g v-for="body in bodies" :key="body.name" :transform="`translate(${body.x} ${body.y})`">
        <circle :r="body.name === 'Sun' || body.name === 'Moon' ? 0.028 : 0.014" :fill="body.name === 'Sun' ? 'var(--alert)' : 'var(--ink)'" stroke="var(--paper)" stroke-width="0.004" />
        <text x="0.036" y="0.012" class="dome__body-label">{{ body.name }}</text>
      </g>
    </g>

    <g>
      <g
        v-for="target in targets"
        :key="target.id"
        class="dome__target"
        :class="{ 'dome__target--on': target.id === selectedId }"
        :transform="`translate(${target.x} ${target.y})`"
        @click="$emit('select', target.id)"
      >
        <circle r="0.04" fill="transparent" />
        <path d="M-0.022 -0.012V-0.022H-0.012M0.012 -0.022H0.022V-0.012M0.022 0.012V0.022H0.012M-0.012 0.022H-0.022V0.012" fill="none" stroke="currentColor" stroke-width="0.005" />
        <circle v-if="target.id === selectedId" class="dome__ping" r="0.03" />
        <text v-if="target.id === selectedId" y="-0.04" class="dome__target-label">{{ target.name }}</text>
        <title>{{ target.name }}</title>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.dome {
  display: block;
  width: 100%;
  height: auto;
}
.dome__line {
  fill: none;
  stroke: var(--line);
  stroke-width: 0.003;
}
.dome__labels text {
  fill: var(--muted);
  font: 500 0.045px var(--font-mono);
  text-anchor: middle;
}
.dome__star-label {
  fill: var(--muted);
  font: 400 0.028px var(--font-mono);
}
.dome__body-label {
  fill: var(--ink);
  font: 600 0.034px var(--font-mono);
}
.dome__target {
  color: var(--signal-text);
  cursor: pointer;
}
.dome__target--on {
  color: var(--ink);
}
.dome__target-label {
  fill: var(--ink);
  font: 700 0.038px var(--font-mono);
  text-anchor: middle;
}
.dome__ping {
  fill: none;
  stroke: var(--signal-text);
  stroke-width: 0.004;
  transform-box: fill-box;
  transform-origin: center;
  animation: ping 2s var(--ease-out) infinite;
}
[data-motion='off'] .dome__ping {
  animation: none;
}
@keyframes ping {
  from {
    transform: scale(0.6);
    opacity: 1;
  }
  to {
    transform: scale(2.6);
    opacity: 0;
  }
}
</style>
