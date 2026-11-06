<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { filterSatellites, SatellitePlate, SatelliteTags, useTracking, type Satellite } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'
import { ROUTES } from '@/shared/config'
import { formatNumber } from '@/shared/lib'
import { DataRow } from '@/shared/ui'

const props = defineProps<{ satellites: Satellite[] }>()

const { t, te } = useI18n()
const router = useRouter()
const store = useSatelliteFilter()
const tracking = useTracking()

const visible = computed(() => filterSatellites(props.satellites, store.filter))
const opened = ref<Satellite | null>(null)
const isOpen = computed({
  get: () => opened.value !== null,
  set: (value) => {
    if (!value) opened.value = null
  },
})

const statusLabel = (code: string | null): string => (code && te(`status.${code}`) ? t(`status.${code}`) : t('status.unknown'))
const ownerLabel = (code: string | null): string | null => (code && te(`owners.${code}`) ? t(`owners.${code}`) : code)

function trackIt(satellite: Satellite): void {
  tracking.trackedId = satellite.noradId
  opened.value = null
  void router.push(ROUTES.control)
}
</script>

<template>
  <div>
    <h2 class="sr-only">{{ t('control.roster') }}</h2>
    <p class="gallery__count" role="status">{{ t('filter.result', { n: visible.length }) }}</p>
    <p v-if="!visible.length" class="gallery__empty">{{ t('filter.empty') }}</p>
    <TransitionGroup v-else name="plate" tag="ul" class="gallery">
      <li v-for="satellite in visible" :key="satellite.noradId" class="gallery__item">
        <SatellitePlate :satellite="satellite" @open="opened = satellite" />
      </li>
    </TransitionGroup>

    <q-dialog v-model="isOpen" :aria-label="t('catalog.detail')">
      <q-card v-if="opened" square class="detail">
        <header class="detail__head">
          <p class="label-mono">{{ t('catalog.detail') }} · #{{ opened.noradId }}</p>
          <h2 class="detail__title">{{ opened.name }}</h2>
          <SatelliteTags :satellite="opened" />
        </header>
        <dl class="detail__rows">
          <DataRow :label="t('catalog.category')" :value="t(`categories.${opened.category}`)" />
          <DataRow :label="t('catalog.mission')" :value="t(`missions.${opened.mission}`)" />
          <DataRow :label="t('catalog.orbit')" :value="`${opened.orbit} · ${t(`orbits.${opened.orbit}`)}`" />
          <DataRow :label="t('catalog.owner')" :value="ownerLabel(opened.owner)" />
          <DataRow :label="t('catalog.status')" :value="statusLabel(opened.opsStatus)" />
          <DataRow :label="t('catalog.noradId')" :value="opened.noradId" />
          <DataRow :label="t('catalog.objectId')" :value="opened.objectId" />
          <DataRow :label="t('catalog.launch')" :value="opened.launchDate" />
          <DataRow :label="t('catalog.launchSite')" :value="opened.launchSite" />
          <DataRow :label="t('catalog.apogee')" :value="opened.apogeeKm === null ? null : `${formatNumber(opened.apogeeKm)} km`" />
          <DataRow :label="t('catalog.perigee')" :value="opened.perigeeKm === null ? null : `${formatNumber(opened.perigeeKm)} km`" />
          <DataRow :label="t('catalog.period')" :value="opened.periodMin === null ? null : `${formatNumber(opened.periodMin, 1)} min`" />
          <DataRow :label="t('catalog.inclination')" :value="opened.inclinationDeg === null ? null : `${formatNumber(opened.inclinationDeg, 2)}°`" />
          <DataRow :label="t('catalog.rcs')" :value="opened.rcsM2 === null ? null : `${formatNumber(opened.rcsM2, 2)} m²`" />
        </dl>
        <q-card-actions align="right" class="detail__actions">
          <q-btn v-close-popup flat no-caps :label="t('catalog.close')" />
          <q-btn unelevated square no-caps color="primary" :label="t('catalog.trackIt')" @click="trackIt(opened)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.gallery__count {
  margin: 0 0 1rem;
  color: var(--muted);
  font: 500 0.8125rem var(--font-mono);
}
.gallery__empty {
  padding: 3rem 0;
  font-size: 1.125rem;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;
}
.plate-move,
.plate-enter-active,
.plate-leave-active {
  transition: transform 0.6s var(--ease-out), opacity 0.35s ease;
}
.plate-enter-from,
.plate-leave-to {
  opacity: 0;
  transform: translateY(1.5rem) scale(0.96);
}
.plate-leave-active {
  position: absolute;
}
.detail {
  width: min(32rem, 94vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--raised);
  color: var(--ink);
}
.detail__head {
  padding: 1.25rem 1rem 1rem;
  border-bottom: 1px solid var(--line);
}
.detail__head .label-mono {
  margin: 0;
}
.detail__title {
  margin: 0.25rem 0 0.625rem;
  font: 800 1.75rem/1.1 var(--font-display);
}
.detail__rows {
  flex: 1;
  margin: 0;
  overflow-y: auto;
}
.detail__actions {
  border-top: 1px solid var(--line);
}
</style>
