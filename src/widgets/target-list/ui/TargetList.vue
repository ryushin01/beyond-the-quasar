<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { equatorialToHorizontal, TARGETS, type TargetKind } from '@/entities/sky'
import { ToggleChip } from '@/shared/ui'

const props = defineProps<{ date: Date; selectedId: string }>()
defineEmits<{ select: [id: string] }>()

const { t } = useI18n()
const observer = useObserver()

const KINDS: TargetKind[] = ['quasar', 'galaxy', 'nebula', 'cluster']
const kind = ref<TargetKind | null>(null)

const rows = computed(() =>
  TARGETS.filter((target) => !kind.value || target.kind === kind.value).map((target) => ({
    ...target,
    altitude: equatorialToHorizontal(target.ra, target.dec, props.date, observer.site).altitude,
  })),
)
</script>

<template>
  <div class="targets">
    <div class="targets__chips">
      <ToggleChip :label="t('observatory.kindAll')" :pressed="kind === null" @toggle="kind = null" />
      <ToggleChip v-for="item in KINDS" :key="item" :label="t(`kinds.${item}`)" :pressed="kind === item" @toggle="kind = item" />
    </div>
    <ul class="targets__list">
      <li v-for="row in rows" :key="row.id">
        <button type="button" class="targets__item" :aria-pressed="row.id === selectedId" @click="$emit('select', row.id)">
          <span class="targets__name">{{ row.name }}</span>
          <span class="targets__kind">{{ t(`kinds.${row.kind}`) }} · {{ row.magnitude.toFixed(1) }} mag</span>
          <span class="targets__alt" :class="{ 'targets__alt--below': row.altitude < 0 }">
            {{ row.altitude >= 0 ? t('observatory.altitudeNow', { n: Math.round(row.altitude) }) : t('observatory.belowHorizon') }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.targets__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}
.targets__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.targets__item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.125rem 0.75rem;
  width: 100%;
  padding: 0.625rem 1rem;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: padding-left 0.3s var(--ease-out), background-color 0.15s ease;
}
.targets__item:hover {
  padding-left: 1.375rem;
}
.targets__item:focus-visible {
  outline-offset: -3px;
}
.targets__item[aria-pressed='true'] {
  background: var(--raised);
  box-shadow: inset 4px 0 0 var(--signal);
  padding-left: 1.375rem;
}
.targets__name {
  font-weight: 700;
  font-size: 0.9375rem;
}
.targets__kind {
  grid-column: 1;
  color: var(--muted);
  font-size: 0.75rem;
}
.targets__alt {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font: 500 0.75rem var(--font-mono);
}
.targets__alt--below {
  color: var(--muted);
}
</style>
