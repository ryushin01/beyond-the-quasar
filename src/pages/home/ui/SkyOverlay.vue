<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { daysUntil, type SkyEvent } from '@/entities/sky'
import { ROUTES } from '@/shared/config'
import { formatLatitude, formatLongitude, formatUtc } from '@/shared/lib'

const props = defineProps<{ now: Date; visibleNames: string[]; nextEvent?: SkyEvent }>()

const { t } = useI18n()
const observer = useObserver()
const panelOpen = ref(false)

const coordinates = computed(() => `${formatLatitude(observer.site.latitude)} · ${formatLongitude(observer.site.longitude)}`)
const nextEventDays = computed(() => (props.nextEvent ? daysUntil(props.nextEvent.date, props.now) : 0))
</script>

<template>
  <div class="sky__ui">
    <header class="sky__head">
      <p class="sky__eyebrow">{{ t('sky.eyebrow') }}</p>
      <h2 id="sky-title" class="sky__title">{{ t('sky.title') }}</h2>
      <p class="sky__hint">{{ t('sky.hint') }}</p>
    </header>

    <div class="sky__explain">
      <button type="button" class="sky__chip" :aria-expanded="panelOpen" aria-controls="sky-panel" @click="panelOpen = !panelOpen">
        {{ t('sky.explain') }}
      </button>
      <div v-show="panelOpen" id="sky-panel" class="sky__panel">
        <p>{{ t('sky.panelBody') }}</p>
        <p class="sky__panel-count">{{ t('sky.panelCount', { count: visibleNames.length }) }}</p>
        <ul class="sky__names">
          <li v-for="name in visibleNames" :key="name">{{ name }}</li>
        </ul>
      </div>
    </div>

    <div class="sky__readout">
      <p class="sky__label">{{ t(`sites.${observer.siteId}`) }}</p>
      <p class="sky__clock">{{ formatUtc(now) }}</p>
      <p class="sky__label">{{ now.toISOString().slice(0, 10) }} UTC</p>
      <p class="sky__label">{{ coordinates }}</p>
    </div>

    <div class="sky__end">
      <RouterLink v-if="nextEvent" :to="ROUTES.event" class="sky__event">
        <span class="sky__label">{{ t('sky.nextEvent') }}</span>
        <span class="sky__event-name">{{ t(`event.names.${nextEvent.id}`) }}</span>
        <span class="sky__label">{{ nextEvent.date.toISOString().slice(0, 10) }} · D-{{ nextEventDays }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* 글자 사이의 빈 곳에서도 하늘을 끌 수 있게 포인터는 조작 요소만 받습니다 */
.sky__ui {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  /* 위는 고정 헤더, 아래는 홈 진행 바만큼 비웁니다 */
  padding: calc(var(--chrome-height) + 1.5rem) var(--margin) 4.5rem;
  pointer-events: none;
}
.sky__ui a,
.sky__ui button,
.sky__panel {
  pointer-events: auto;
}
.sky__eyebrow,
.sky__label {
  margin: 0;
  color: #8a8a8a;
  font: 500 0.75rem/1.5 var(--font-mono);
  text-transform: uppercase;
}
.sky__title {
  margin: 0.125rem 0;
  font: 700 clamp(1.25rem, 2vw, 1.75rem) / 1.2 var(--font-display);
}
.sky__hint {
  margin: 0;
  color: #8a8a8a;
  font-size: 0.9375rem;
}
.sky__explain {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}
.sky__chip {
  min-height: 2.75rem;
  padding: 0 1rem;
  background: #fff;
  border: 0;
  color: #000;
  font: 700 0.8125rem var(--font-mono);
  cursor: pointer;
}
.sky__chip:hover {
  background: var(--signal-text);
  color: var(--on-signal);
}
.sky__panel {
  width: min(22rem, calc(100vw - 2 * var(--margin)));
  max-height: 46svh;
  padding: 1.25rem;
  overflow-y: auto;
  background: #000;
  border: 1px solid #fff;
  font-size: 0.9375rem;
}
.sky__panel p {
  margin: 0 0 0.75rem;
}
.sky__panel-count {
  font: 500 0.8125rem var(--font-mono);
  color: #8a8a8a;
}
.sky__names {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font: 500 0.8125rem var(--font-mono);
}
.sky__readout {
  grid-row: 3;
  align-self: end;
}
.sky__readout p {
  margin: 0;
}
.sky__clock {
  font: 500 clamp(1.5rem, 2.4vw, 2rem) / 1.25 var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.sky__end {
  grid-row: 3;
  grid-column: 2;
  align-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  /* 플로팅 버튼 자리를 비웁니다 */
  margin-right: 4.5rem;
  text-align: right;
}
.sky__event {
  display: flex;
  flex-direction: column;
  min-height: 2.75rem;
  color: #fff;
  text-decoration: none;
}
.sky__event:hover .sky__event-name {
  color: var(--signal-text);
}
.sky__event-name {
  font: 500 clamp(1.25rem, 2vw, 1.75rem) / 1.25 var(--font-mono);
  transition: color 0.25s ease;
}
@media (max-width: 719px) {
  .sky__ui {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;
  }
  .sky__explain {
    align-items: flex-start;
  }
  .sky__panel {
    max-height: 34svh;
  }
  .sky__readout {
    grid-row: 4;
  }
  .sky__end {
    grid-row: 5;
    grid-column: 1;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
