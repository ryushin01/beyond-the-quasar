<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ days: number }>()

const { t } = useI18n()
</script>

<template>
  <p class="stale-notice" role="status">{{ t('control.staleSnapshot', { n: days }) }}</p>
</template>

<style scoped>
.stale-notice {
  margin: 0;
  padding: 0.5rem 0.625rem;
  border-left: 3px solid var(--alert);
  color: var(--alert);
  font: 400 0.75rem/1.4 var(--font-mono);
}
</style>
