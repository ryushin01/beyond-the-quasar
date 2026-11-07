<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSatelliteFilter } from '@/features/filter-satellites'
import { SatelliteTags, useTracking, type Satellite } from '@/entities/satellite'
import { WatchToggle } from '@/features/watch-satellite'

const props = defineProps<{ satellites: Satellite[] }>()

const { t } = useI18n()
const store = useSatelliteFilter()
const tracking = useTracking()

const visible = computed(() => store.apply(props.satellites))
</script>

<template>
  <div class="roster">
    <p class="roster__count" role="status">{{ t('filter.result', { n: visible.length }) }}</p>
    <p v-if="!visible.length" class="roster__empty">{{ t('filter.empty') }}</p>
    <ul v-else class="roster__list">
      <li v-for="satellite in visible" :key="satellite.noradId" class="roster__row">
        <button
          type="button"
          class="roster__item"
          :aria-pressed="tracking.trackedId === satellite.noradId"
          @click="tracking.trackedId = satellite.noradId"
        >
          <span class="roster__name">{{ satellite.name }}</span>
          <span class="roster__id">{{ satellite.noradId }}</span>
          <SatelliteTags :satellite="satellite" compact inline class="roster__tags" />
        </button>
        <WatchToggle class="roster__watch" :satellite="satellite" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.roster {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.roster__count {
  margin: 0;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font: 500 0.75rem var(--font-mono);
}
.roster__empty {
  margin: 0;
  padding: 1rem;
  font-size: 0.875rem;
}
.roster__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}
.roster__row {
  position: relative;
}
.roster__watch {
  position: absolute;
  right: 0.5rem;
  bottom: 0.375rem;
}
.roster__item {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.25rem 0.5rem;
  width: 100%;
  padding: 0.625rem 2.75rem 0.625rem 1rem;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: padding-left 0.3s var(--ease-out), background-color 0.15s ease;
}
.roster__item:hover {
  padding-left: 1.375rem;
  background: var(--raised);
}
.roster__item:focus-visible {
  outline-offset: -3px;
}
.roster__item[aria-pressed='true'] {
  padding-left: 1.375rem;
  background: var(--raised);
  box-shadow: inset 4px 0 0 var(--signal);
}
.roster__name {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.3;
}
.roster__id {
  color: var(--muted);
  font: 400 0.75rem var(--font-mono);
}
.roster__tags {
  grid-column: 1 / -1;
}
</style>
