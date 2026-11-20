<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { sectionId } from '../lib/chapters'

const FACT_COUNT = 3

const { t } = useI18n()
</script>

<template>
  <section :id="sectionId('horizon')" class="chapter chapter--horizon" tabindex="-1" aria-labelledby="event-horizon-title">
    <div class="horizon">
      <div class="horizon__copy">
        <p class="horizon__kicker" data-reveal>{{ t('event.horizon.kicker') }}</p>
        <h2 id="event-horizon-title" class="horizon__title" data-reveal>
          <span>{{ t('event.horizon.titleA') }}</span>
          <span>{{ t('event.horizon.titleB') }}</span>
        </h2>
      </div>
      <aside class="facts" :aria-label="t('event.horizon.factsLabel')" data-reveal>
        <p class="eyebrow">{{ t('event.horizon.eyebrow') }}</p>
        <dl class="facts__list">
          <div v-for="index in FACT_COUNT" :key="index" class="facts__item">
            <dt>{{ t(`event.horizon.facts[${index - 1}].name`) }}</dt>
            <dd>
              <strong>{{ t(`event.horizon.facts[${index - 1}].value`) }}</strong>
              <span>{{ t(`event.horizon.facts[${index - 1}].detail`) }}</span>
            </dd>
          </div>
        </dl>
        <p class="facts__render">{{ t('event.horizon.render') }}</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.horizon {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 23rem);
  align-items: end;
  gap: 2rem;
  width: 100%;
}
.horizon__kicker {
  margin: 0 0 0.5rem;
  color: #b9bbc8;
  font-size: 1rem;
}
.facts {
  padding: 1.25rem;
  background: rgb(10 10 16 / 0.5);
  border: 1px solid rgb(255 255 255 / 0.22);
  backdrop-filter: blur(10px);
  color: #b9bbc8;
}
.facts__list {
  margin: 0;
}
.facts__item {
  padding-block: 0.625rem;
  border-top: 1px solid rgb(255 255 255 / 0.16);
}
.facts dt {
  font: 500 0.75rem var(--font-mono);
  color: #8b8d9c;
}
.facts dd {
  display: grid;
  margin: 0.125rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
}
.facts strong {
  color: #fff;
  font-weight: 700;
}
.facts__render {
  margin: 0.5rem 0 0;
  padding-top: 0.625rem;
  border-top: 1px solid rgb(255 255 255 / 0.16);
  color: #8b8d9c;
  font-size: 0.8125rem;
  line-height: 1.45;
}
@media (max-width: 1000px) {
  .horizon {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
