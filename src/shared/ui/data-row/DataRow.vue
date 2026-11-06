<script setup lang="ts">
defineProps<{ label: string; value?: string | number | null }>()
</script>

<template>
  <div class="data-row">
    <dt class="label-mono">{{ label }}</dt>
    <dd class="data-row__value">
      <slot>{{ value ?? '—' }}</slot>
    </dd>
  </div>
</template>

<style scoped>
.data-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--line);
}
.data-row__value {
  margin: 0;
  font: 500 0.875rem var(--font-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ink);
}
</style>
