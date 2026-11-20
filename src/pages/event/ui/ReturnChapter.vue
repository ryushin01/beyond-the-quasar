<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { ROUTES } from '@/shared/config'

import { sectionId } from '../lib/chapters'

const { t } = useI18n()
</script>

<template>
  <section :id="sectionId('return')" class="chapter chapter--return" tabindex="-1" aria-labelledby="event-return-title">
    <div class="return">
      <p class="eyebrow" data-reveal>{{ t('event.return.eyebrow') }}</p>
      <h2 id="event-return-title" class="horizon__title" data-reveal>
        <span>{{ t('event.return.titleA') }}</span>
        <span>{{ t('event.return.titleB') }}</span>
      </h2>
      <div class="return__links" data-reveal>
        <RouterLink :to="ROUTES.observatory" class="cut-link"><span class="cut-link__mark" aria-hidden="true" />{{ t('event.return.toObservatory') }}</RouterLink>
        <RouterLink :to="ROUTES.control" class="cut-link"><span class="cut-link__mark" aria-hidden="true" />{{ t('event.return.toControl') }}</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.return__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}
</style>
