<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { UplinkForm } from '@/features/send-command'
import { useMissionClock } from '@/entities/clock'
import { useObserver } from '@/entities/observer'
import { lookAngleAt, predictPasses, separationKm, toSatrec, type Satellite } from '@/entities/satellite'
import { formatDuration, formatNumber, formatUtc } from '@/shared/lib'

const props = defineProps<{ satellite: Satellite; satellites: Satellite[] }>()

const { t } = useI18n()
const clock = useMissionClock()
const observer = useObserver()

const tab = ref<'passes' | 'uplink' | 'overflight' | 'proximity'>('passes')

const tabLabel = computed(() =>
  ({ passes: t('control.tabPasses'), uplink: t('control.tabUplink'), overflight: t('control.tabOverflight'), proximity: t('control.tabProximity') })[tab.value],
)

const satrec = computed(() => toSatrec(props.satellite.line1, props.satellite.line2))
const siteName = computed(() => t(`sites.${observer.siteId}`))
const CONTACT_ELEVATION = 5

/** 한 번 계산하면 1분(가상 시각 기준)마다 다시 계산합니다. */
const minuteKey = computed(() => Math.floor(clock.now.getTime() / 60_000))
const passes = computed(() => (props.satellite.orbit === 'GEO' ? [] : predictPasses(satrec.value, observer.site, new Date(minuteKey.value * 60_000))))

const contactRange = computed(() => {
  const look = lookAngleAt(satrec.value, clock.now, observer.site)
  return look && look.elevation >= CONTACT_ELEVATION ? look.rangeKm : null
})

// 목록 계산은 시계 틱마다가 아니라 초 단위로 합니다.
const secondKey = computed(() => Math.floor(clock.now.getTime() / 1000))

const overhead = computed(() => {
  if (tab.value !== 'overflight') return []
  const date = new Date(secondKey.value * 1000)
  return props.satellites
    .map((satellite) => ({ satellite, look: lookAngleAt(toSatrec(satellite.line1, satellite.line2), date, observer.site) }))
    .filter((row) => row.look && row.look.elevation >= CONTACT_ELEVATION)
    .sort((a, b) => b.look!.elevation - a.look!.elevation)
})
const overheadMilitary = computed(() => overhead.value.filter((row) => row.satellite.category === 'military').length)

const nearest = computed(() => {
  if (tab.value !== 'proximity') return []
  const date = new Date(secondKey.value * 1000)
  return props.satellites
    .filter((satellite) => satellite.noradId !== props.satellite.noradId)
    .map((satellite) => ({ satellite, km: separationKm(satrec.value, toSatrec(satellite.line1, satellite.line2), date) }))
    .filter((row): row is { satellite: Satellite; km: number } => row.km !== null)
    .sort((a, b) => a.km - b.km)
    .slice(0, 8)
})
</script>

<template>
  <div class="panels">
    <q-tabs v-model="tab" dense no-caps align="justify" indicator-color="transparent" class="panels__tabs" :aria-label="t('control.tabs')">
      <q-tab name="passes" :label="t('control.tabPasses')" />
      <q-tab name="uplink" :label="t('control.tabUplink')" />
      <q-tab name="overflight" :label="t('control.tabOverflight')" />
      <q-tab name="proximity" :label="t('control.tabProximity')" />
    </q-tabs>

    <div class="panels__body" role="tabpanel" tabindex="0" :aria-label="tabLabel">
      <template v-if="tab === 'passes'">
        <p v-if="satellite.orbit === 'GEO'" class="panels__note">{{ t('passes.geostationary') }}</p>
        <p v-else-if="!passes.length" class="panels__note">{{ t('passes.none') }}</p>
        <table v-else class="table">
          <caption>{{ t('passes.caption', { site: siteName }) }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ t('passes.aos') }}</th>
              <th scope="col">{{ t('passes.los') }}</th>
              <th scope="col">{{ t('passes.duration') }}</th>
              <th scope="col">{{ t('passes.max') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pass in passes" :key="pass.aos.getTime()">
              <td>{{ formatUtc(pass.aos) }}</td>
              <td>{{ formatUtc(pass.los) }}</td>
              <td>{{ formatDuration((pass.los.getTime() - pass.aos.getTime()) / 1000) }}</td>
              <td>{{ formatNumber(pass.maxElevation, 0) }}°</td>
            </tr>
          </tbody>
        </table>
      </template>

      <UplinkForm
        v-else-if="tab === 'uplink'"
        :norad-id="satellite.noradId"
        :satellite-name="satellite.name"
        :range-km="contactRange"
      />

      <template v-else-if="tab === 'overflight'">
        <p class="panels__stats">
          <span>{{ t('overflight.total', { n: overhead.length }) }}</span>
          <span class="panels__mil">{{ t('overflight.military', { n: overheadMilitary }) }}</span>
        </p>
        <p v-if="!overhead.length" class="panels__note">{{ t('overflight.none') }}</p>
        <table v-else class="table">
          <caption>{{ t('overflight.caption', { site: siteName }) }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ t('overflight.name') }}</th>
              <th scope="col">{{ t('overflight.azel') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in overhead" :key="row.satellite.noradId">
              <th scope="row" :class="{ 'table__mil': row.satellite.category === 'military' }">{{ row.satellite.name }}</th>
              <td>{{ formatNumber(row.look!.azimuth) }}° / {{ formatNumber(row.look!.elevation) }}°</td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-else>
        <table class="table">
          <caption>{{ t('proximity.caption', { name: satellite.name }) }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ t('overflight.name') }}</th>
              <th scope="col">{{ t('proximity.distance') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in nearest" :key="row.satellite.noradId">
              <th scope="row" :class="{ 'table__mil': row.satellite.category === 'military' }">{{ row.satellite.name }}</th>
              <td>{{ formatNumber(row.km) }} km</td>
            </tr>
          </tbody>
        </table>
        <p class="panels__note">{{ t('proximity.note') }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.panels {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.panels__tabs {
  flex: none;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.panels__tabs :deep(.q-tab--active) {
  color: var(--paper);
  background: var(--ink);
}
.panels__body {
  flex: 1;
  min-height: 12rem;
  overflow-y: auto;
}
.panels__note {
  margin: 0;
  padding: 1rem;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.panels__stats {
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
  font: 600 1rem var(--font-mono);
}
.panels__mil {
  color: var(--alert);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.table caption {
  padding: 0.625rem 1rem;
  color: var(--muted);
  font-size: 0.75rem;
  text-align: left;
}
.table th,
.table td {
  padding: 0.4375rem 1rem;
  border-top: 1px solid var(--line);
  text-align: left;
  font-weight: 400;
}
.table thead th {
  color: var(--muted);
  font: 500 0.6875rem var(--font-mono);
}
.table tbody td {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  white-space: nowrap;
}
.table tbody th {
  font-weight: 600;
}
.table__mil {
  color: var(--alert);
}
</style>
