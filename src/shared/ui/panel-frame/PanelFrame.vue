<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ title: string; code?: string }>()
const headingId = useId()
</script>

<template>
  <section class="panel" :aria-labelledby="headingId">
    <header class="panel-head">
      <h2 :id="headingId" class="panel__title">{{ title }}</h2>
      <slot name="actions">
        <span v-if="code" class="label-mono" aria-hidden="true">{{ code }}</span>
      </slot>
    </header>
    <slot />
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}
.panel__title {
  margin: 0;
  font: 600 0.8125rem/1.3 var(--font-sans);
  letter-spacing: 0.01em;
  color: var(--ink);
}
</style>
