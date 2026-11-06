<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock, WARP_RATES } from '@/entities/clock'
import { formatUtc } from '@/shared/lib'

const { t } = useI18n()
const clock = useMissionClock()
const stamp = computed(() => formatUtc(clock.now, true))
</script>

<template>
  <div class="time" role="group" :aria-label="t('time.controls')">
    <p class="time__stamp">
      <span class="time__state" :class="{ 'time__state--sim': !clock.isLive }">{{ clock.isLive ? t('time.isLive') : t('time.simulated') }}</span>
      <time :datetime="clock.now.toISOString()">{{ stamp }}</time>
    </p>
    <div class="time__buttons">
      <button type="button" class="time__btn" @click="clock.togglePaused()">{{ clock.paused ? t('time.play') : t('time.pause') }}</button>
      <button
        v-for="rate in WARP_RATES"
        :key="rate"
        type="button"
        class="time__btn time__btn--rate"
        :aria-pressed="clock.rate === rate && !clock.paused"
        :aria-label="`${t('time.rate')} ${rate}×`"
        @click="clock.setRate(rate)"
      >
        {{ rate }}×
      </button>
      <button type="button" class="time__btn" :disabled="clock.isLive" @click="clock.reset()">{{ t('time.live') }}</button>
    </div>
  </div>
</template>

<style scoped>
.time {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}
.time__stamp {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  font: 500 0.8125rem var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.time__state {
  padding: 0 0.375rem;
  background: var(--signal);
  color: var(--on-signal);
  font-size: 0.6875rem;
}
.time__state--sim {
  background: var(--alert);
  color: #000;
}
.time__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.time__btn {
  min-height: 2.25rem;
  padding: 0 0.625rem;
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font: 500 0.75rem var(--font-sans);
  cursor: pointer;
}
.time__btn--rate {
  font-family: var(--font-mono);
}
.time__btn:hover:not(:disabled) {
  border-color: var(--ink);
}
.time__btn[aria-pressed='true'] {
  background: var(--ink);
  color: var(--paper);
}
.time__btn:disabled {
  color: var(--muted);
  cursor: default;
}
</style>
