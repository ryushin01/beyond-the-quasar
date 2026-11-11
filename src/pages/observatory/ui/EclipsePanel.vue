<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { eyepieceScene, type EclipseWindow } from '@/entities/sky'
import { formatUtc } from '@/shared/lib'

import { describePeakOffset } from '../lib/peak-offset'
import EyepieceView from './EyepieceView.vue'

const props = defineProps<{ eclipse: EclipseWindow; date: Date }>()
const offset = defineModel<number>('offset', { required: true })

const STEP_MINUTES = 5
const { t } = useI18n()
const observer = useObserver()

const scene = computed(() => eyepieceScene(props.eclipse.id, props.date, observer.site))
// 막대 끝이 시작·끝 시각 밖으로 나가지 않도록 5분 단위로 안쪽에 맞춥니다.
const minMinutes = computed(() => Math.ceil((props.eclipse.start.getTime() - props.eclipse.peak.getTime()) / 60_000 / STEP_MINUTES) * STEP_MINUTES)
const maxMinutes = computed(() => Math.floor((props.eclipse.end.getTime() - props.eclipse.peak.getTime()) / 60_000 / STEP_MINUTES) * STEP_MINUTES)
const rows = computed(() => [
  { key: 'start', value: formatUtc(props.eclipse.start, true) },
  { key: 'peak', value: formatUtc(props.eclipse.peak, true) },
  { key: 'end', value: formatUtc(props.eclipse.end, true) },
  { key: 'peakAltitude', value: `${props.eclipse.peakAltitude.toFixed(1)}°` },
  ...(props.eclipse.obscuration === null ? [] : [{ key: 'obscuration', value: `${Math.round(props.eclipse.obscuration * 100)}%` }]),
])

const offsetLabel = computed(() => describePeakOffset(offset.value, t))
</script>

<template>
  <div class="eclipse">
    <div class="eclipse__info">
      <p class="eclipse__kind">{{ t(`event.names.${eclipse.id}`) }} · {{ t(`event.kinds.${eclipse.kind}`) }}</p>
      <p class="eclipse__badge" :class="`eclipse__badge--${eclipse.visibility}`">{{ t(`observatory.eclipse.visibility.${eclipse.visibility}`) }}</p>
      <dl class="eclipse__rows">
        <div v-for="row in rows" :key="row.key" class="eclipse__row">
          <dt>{{ t(`observatory.eclipse.${row.key}`) }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
      <div class="eclipse__slider">
        <p class="label-mono" aria-hidden="true">{{ t('observatory.eclipse.slider') }} · {{ offsetLabel }} · {{ formatUtc(date, true) }}</p>
        <q-slider
          v-model="offset"
          :min="minMinutes"
          :max="maxMinutes"
          :step="STEP_MINUTES"
          color="primary"
          :aria-label="t('observatory.eclipse.slider')"
          :aria-valuetext="offsetLabel"
        />
      </div>
    </div>
    <EyepieceView :id="eclipse.id" :scene="scene" />
  </div>
</template>

<style scoped>
.eclipse {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 2rem;
  padding: 1.5rem;
}
.eclipse__kind {
  margin: 0;
  font: 800 clamp(1.5rem, 2.6vw, 2.25rem) / 1.15 var(--font-display);
}
.eclipse__badge {
  display: inline-block;
  margin: 0.75rem 0 1.25rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid currentColor;
  font: 600 0.8125rem var(--font-mono);
}
.eclipse__badge--visible {
  color: var(--signal-text);
}
.eclipse__badge--partlyVisible {
  color: var(--alert);
}
.eclipse__badge--notVisible {
  color: var(--muted);
}
.eclipse__rows {
  margin: 0;
}
.eclipse__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.5rem;
  border-top: 1px solid var(--line);
  font: 500 0.875rem var(--font-mono);
}
.eclipse__row dt {
  color: var(--muted);
}
.eclipse__row dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.eclipse__slider {
  margin-top: 1.5rem;
}
@media (max-width: 860px) {
  .eclipse {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
