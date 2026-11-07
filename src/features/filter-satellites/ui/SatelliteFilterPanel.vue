<script setup lang="ts">
import { symSharpClose, symSharpSearch } from '@quasar/extras/material-symbols-sharp'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { CATEGORIES, countBy, MISSIONS, ORBITS, useWatchlist, type Satellite } from '@/entities/satellite'
import { ToggleChip } from '@/shared/ui'

import { useSatelliteFilter } from '../model/filter'

const props = defineProps<{ satellites: Satellite[]; dense?: boolean }>()

const { t, te } = useI18n()
const store = useSatelliteFilter()
const watchlist = useWatchlist()

const categoryCounts = computed(() => countBy(props.satellites, (item) => item.category))
const missionCounts = computed(() => countBy(props.satellites, (item) => item.mission))
const orbitCounts = computed(() => countBy(props.satellites, (item) => item.orbit))
const ownerCounts = computed(() => countBy(props.satellites, (item) => item.owner))
const owners = computed(() => [...ownerCounts.value.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code))
const ownerLabel = (code: string): string => (te(`owners.${code}`) ? t(`owners.${code}`) : code)
</script>

<template>
  <div class="filters" :class="{ 'filters--dense': dense }">
    <q-input
      v-model="store.filter.query"
      dense
      outlined
      square
      clearable
      :clear-icon="symSharpClose"
      debounce="120"
      :label="t('filter.search')"
      :hint="dense ? undefined : t('filter.searchHint')"
    >
      <template #prepend><q-icon :name="symSharpSearch" /></template>
    </q-input>

    <fieldset class="group">
      <legend class="label-mono">{{ t('filter.category') }}</legend>
      <div class="chips">
        <ToggleChip
          v-for="category in CATEGORIES"
          :key="category"
          :label="t(`categories.${category}`)"
          :count="categoryCounts.get(category) ?? 0"
          :pressed="store.filter.categories.includes(category)"
          :tone="category === 'military' ? 'alert' : 'default'"
          @toggle="store.toggleCategory(category)"
        />
      </div>
    </fieldset>

    <template v-if="!dense">
      <fieldset class="group">
        <legend class="label-mono">{{ t('filter.mission') }}</legend>
        <div class="chips">
          <ToggleChip
            v-for="mission in MISSIONS"
            :key="mission"
            :label="t(`missions.${mission}`)"
            :count="missionCounts.get(mission) ?? 0"
            :pressed="store.filter.missions.includes(mission)"
            @toggle="store.toggleMission(mission)"
          />
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="label-mono">{{ t('filter.owner') }}</legend>
        <div class="chips">
          <ToggleChip
            v-for="owner in owners"
            :key="owner"
            :label="ownerLabel(owner)"
            :count="ownerCounts.get(owner) ?? 0"
            :pressed="store.filter.owners.includes(owner)"
            @toggle="store.toggleOwner(owner)"
          />
        </div>
      </fieldset>
    </template>

    <fieldset class="group">
      <legend class="label-mono">{{ t('filter.orbit') }}</legend>
      <div class="chips">
        <ToggleChip
          v-for="orbit in ORBITS"
          :key="orbit"
          :label="dense ? orbit : `${orbit} ${t(`orbits.${orbit}`)}`"
          :count="orbitCounts.get(orbit) ?? 0"
          :pressed="store.filter.orbits.includes(orbit)"
          @toggle="store.toggleOrbit(orbit)"
        />
      </div>
    </fieldset>

    <div class="foot">
      <ToggleChip :label="t('filter.watched')" :count="watchlist.ids.length" :pressed="store.filter.watchedOnly" @toggle="store.filter.watchedOnly = !store.filter.watchedOnly" />
      <ToggleChip :label="t('filter.dualUse')" :pressed="store.filter.dualUseOnly" @toggle="store.filter.dualUseOnly = !store.filter.dualUseOnly" />
      <button v-if="store.isActive" type="button" class="reset" @click="store.reset()">{{ t('filter.reset') }}</button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.filters--dense {
  gap: 0.5rem;
}
.filters--dense .group legend {
  margin-bottom: 0.25rem;
}
.filters--dense :deep(.chip) {
  min-height: 1.75rem;
  padding: 0.125rem 0.5rem;
  gap: 0.25rem;
  font-size: 0.75rem;
}
.filters--dense .chips {
  gap: 0.25rem;
}
.group {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
.group legend {
  padding: 0;
  margin-bottom: 0.5rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.reset {
  min-height: 2.25rem;
  background: none;
  border: 0;
  color: var(--ink);
  font: 500 0.8125rem var(--font-sans);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
</style>
