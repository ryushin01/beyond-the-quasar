<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <ul class="map__legend">
    <li><span class="key key--tracked" aria-hidden="true" />{{ t('control.legendTracked') }}</li>
    <li><span class="key key--mil" aria-hidden="true" />{{ t('control.legendMilitary') }}</li>
    <li><span class="key key--other" aria-hidden="true" />{{ t('control.legendOther') }}</li>
    <li><span class="key key--site" aria-hidden="true" />{{ t('control.legendSite') }}</li>
    <li><span class="key key--track" aria-hidden="true" />{{ t('control.legendTrack') }}</li>
    <li><span class="key key--night" aria-hidden="true" />{{ t('control.legendNight') }}</li>
  </ul>
</template>

<style scoped>
.map__legend {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin: 0;
  padding: 0.375rem 0.625rem;
  max-width: calc(100% - 1.5rem);
  background: var(--paper);
  border: 1px solid var(--line);
  list-style: none;
  font: 400 0.6875rem var(--font-mono);
}
.map__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.key {
  display: inline-block;
  width: 8px;
  height: 8px;
}
.key--tracked {
  background: var(--signal);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--ink);
}
.key--mil {
  background: var(--alert);
  transform: rotate(45deg);
}
.key--other {
  background: var(--ink);
  border-radius: 50%;
  width: 5px;
  height: 5px;
}
.key--site {
  border: 1.5px solid var(--ink);
}
.key--night {
  background: var(--night);
  box-shadow: inset 0 0 0 1px var(--line-strong);
}
.key--track {
  width: 14px;
  height: 0;
  border-top: 2px dashed var(--signal);
}
</style>
