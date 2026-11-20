<script setup lang="ts">
import { symSharpAdd, symSharpRemove } from '@quasar/extras/material-symbols-sharp'
import { useI18n } from 'vue-i18n'

import type { MapMode } from '../lib/projection'

defineProps<{ mode: MapMode }>()
const emit = defineEmits<{ mode: [mode: MapMode]; zoom: [factor: number] }>()

const { t } = useI18n()
</script>

<template>
  <div class="map__tools">
    <div class="map__group" role="group" :aria-label="t('control.projection')">
      <button type="button" class="map__btn map__btn--text" :aria-pressed="mode === 'flat'" @click="emit('mode', 'flat')">{{ t('control.flat') }}</button>
      <button type="button" class="map__btn map__btn--text" :aria-pressed="mode === 'globe'" @click="emit('mode', 'globe')">{{ t('control.globe') }}</button>
    </div>
    <div class="map__group">
      <button type="button" class="map__btn" :aria-label="t('control.zoomIn')" @click="emit('zoom', 1.5)"><q-icon :name="symSharpAdd" size="1.125rem" /></button>
      <button type="button" class="map__btn" :aria-label="t('control.zoomOut')" @click="emit('zoom', 1 / 1.5)"><q-icon :name="symSharpRemove" size="1.125rem" /></button>
    </div>
  </div>
</template>

<style scoped>
.map__tools {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.map__group {
  display: flex;
  background: var(--paper);
  border: 1px solid var(--line-strong);
}
.map__btn {
  display: inline-grid;
  place-items: center;
  min-width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: 0;
  color: var(--ink);
  cursor: pointer;
}
.map__btn--text {
  padding: 0 0.75rem;
  font: 500 0.8125rem var(--font-sans);
}
.map__btn:hover {
  background: var(--raised);
}
.map__btn[aria-pressed='true'] {
  background: var(--ink);
  color: var(--paper);
}
</style>
