<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { goToSection } from '@/shared/motion'

import { sectionId } from '../lib/chapters'

const { t } = useI18n()
</script>

<template>
  <section :id="sectionId('signal')" class="chapter chapter--signal" tabindex="-1">
    <div class="signal">
      <p class="eyebrow" data-reveal>{{ t('event.signal.eyebrow') }}</p>
      <h1 class="signal__title" data-reveal>
        <span>{{ t('event.signal.titleA') }}</span>
        <span>{{ t('event.signal.titleB') }}</span>
      </h1>
      <p class="signal__body" data-reveal>{{ t('event.signal.body') }}</p>
      <a :href="`#${sectionId('calendar')}`" class="cut-link" data-reveal @click.prevent="goToSection(sectionId('calendar'))">
        <span class="cut-link__mark" aria-hidden="true" />{{ t('event.signal.cta') }}
      </a>
    </div>
  </section>
</template>

<style scoped>
.signal {
  position: relative;
  isolation: isolate;
  max-width: 44rem;
  padding-bottom: 1rem;
}
.signal__title span {
  display: block;
}
.signal__title {
  margin: 0;
  color: #eef2ff;
  font: 700 clamp(2rem, 4.2vw, 3.5rem) / 1.12 var(--font-display);
  font-stretch: 105%;
}
.signal__body {
  max-width: 34rem;
  margin: 1rem auto 1.5rem;
  color: var(--hud-body);
  font-size: 1.0625rem;
}
</style>
