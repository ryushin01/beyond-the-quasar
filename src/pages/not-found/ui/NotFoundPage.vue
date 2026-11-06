<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { ROUTES } from '@/shared/config'

const { t } = useI18n()
</script>

<template>
  <div class="missing">
    <p class="missing__code display" aria-hidden="true">{{ t('notFound.code') }}</p>
    <h1 class="missing__title">{{ t('notFound.title') }}</h1>
    <RouterLink :to="ROUTES.home" class="missing__link">{{ t('notFound.back') }}</RouterLink>
  </div>
</template>

<style scoped>
.missing {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  padding: clamp(3rem, 8vw, 7rem) var(--margin);
}
.missing__code {
  margin: 0;
  font-size: clamp(6rem, 28vw, 24rem);
}
.missing__title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 800;
  line-height: 1.2;
}
.missing__link {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  font-weight: 600;
}
</style>
