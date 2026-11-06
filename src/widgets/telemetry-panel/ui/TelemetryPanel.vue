<script setup lang="ts">
import { extent } from 'd3-array'
import { scaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { useObserver } from '@/entities/observer'
import { lookAngleAt, orbitalPeriodMin, SatelliteTags, stateAt, toSatrec, type Satellite } from '@/entities/satellite'
import { formatDms, formatNumber } from '@/shared/lib'
import { DataRow } from '@/shared/ui'

const props = defineProps<{ satellite: Satellite }>()

const { t } = useI18n()
const clock = useMissionClock()
const observer = useObserver()

const satrec = computed(() => toSatrec(props.satellite.line1, props.satellite.line2))
const state = computed(() => stateAt(satrec.value, clock.now))
const look = computed(() => lookAngleAt(satrec.value, clock.now, observer.site))
const inContact = computed(() => (look.value?.elevation ?? -90) >= 5)
const period = computed(() => orbitalPeriodMin(props.satellite.line2))
const tleAge = computed(() => Math.max(0, Math.floor((clock.now.getTime() - props.satellite.epoch.getTime()) / 86_400_000)))

const WIDTH = 320
const HEIGHT = 56

/** 현재 위치부터 한 궤도의 고도 변화 */
const profileMinute = computed(() => Math.floor(clock.now.getTime() / 60_000))
const profile = computed(() => {
  const start = profileMinute.value * 60_000
  const samples: { minute: number; altitude: number }[] = []
  for (let i = 0; i <= 60; i += 1) {
    const minute = (period.value * i) / 60
    const sample = stateAt(satrec.value, new Date(start + minute * 60_000))
    if (sample) samples.push({ minute, altitude: sample.altitudeKm })
  }
  const [min = 0, max = 1] = extent(samples, (sample) => sample.altitude)
  const pad = Math.max(0.5, (max - min) * 0.15)
  const x = scaleLinear().domain([0, period.value]).range([0, WIDTH])
  const y = scaleLinear().domain([min - pad, max + pad]).range([HEIGHT - 4, 4])
  return {
    min,
    max,
    path: line<{ minute: number; altitude: number }>().x((sample) => x(sample.minute)).y((sample) => y(sample.altitude))(samples) ?? '',
  }
})
</script>

<template>
  <div class="telemetry">
    <div class="telemetry__head">
      <p class="telemetry__name">{{ satellite.name }}</p>
      <SatelliteTags :satellite="satellite" />
      <p class="telemetry__mission">{{ t(`missions.${satellite.mission}`) }}</p>
    </div>
    <dl class="telemetry__rows">
      <DataRow :label="t('control.latitude')" :value="state ? formatDms(state.latitude, 'N', 'S') : null" />
      <DataRow :label="t('control.longitude')" :value="state ? formatDms(state.longitude, 'E', 'W') : null" />
      <DataRow :label="t('control.altitude')" :value="state ? `${formatNumber(state.altitudeKm, 1)} km` : null" />
      <DataRow :label="t('control.speed')" :value="state ? `${formatNumber(state.speedKmS, 2)} km/s` : null" />
      <DataRow :label="t('control.period')" :value="`${formatNumber(period, 1)} min`" />
      <DataRow :label="t('control.inclination')" :value="satellite.inclinationDeg === null ? null : `${formatNumber(satellite.inclinationDeg, 2)}°`" />
      <DataRow :label="t('control.azel')" :value="look ? `${formatNumber(look.azimuth, 1)}° / ${formatNumber(look.elevation, 1)}°` : null" />
      <DataRow :label="t('control.range')" :value="look ? `${formatNumber(look.rangeKm)} km` : null" />
      <DataRow :label="t('control.contact')">
        <span :class="inContact ? 'telemetry__on' : 'telemetry__off'">{{ inContact ? t('control.inContact') : t('control.noContact') }}</span>
      </DataRow>
      <DataRow :label="t('control.tleAge')" :value="t('control.tleAgeValue', { n: tleAge })" />
    </dl>
    <figure class="telemetry__chart">
      <figcaption class="label-mono">{{ t('control.altitudeProfile') }} · {{ formatNumber(profile.min) }}–{{ formatNumber(profile.max) }} km</figcaption>
      <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" aria-hidden="true">
        <path :d="profile.path" fill="none" stroke="var(--signal-text)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      </svg>
    </figure>
  </div>
</template>

<style scoped>
.telemetry__head {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}
.telemetry__name {
  margin: 0;
  font: 800 1.25rem/1.1 var(--font-display);
  font-stretch: 100%;
}
.telemetry__mission {
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
}
.telemetry__rows {
  margin: 0;
}
.telemetry__on {
  color: var(--signal-text);
}
.telemetry__off {
  color: var(--muted);
}
.telemetry__chart {
  margin: 0;
  padding: 0.625rem 1rem;
}
.telemetry__chart svg {
  display: block;
  width: 100%;
  height: 3.5rem;
  margin-top: 0.25rem;
}
</style>
