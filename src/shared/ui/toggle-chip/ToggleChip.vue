<script setup lang="ts">
defineProps<{ label: string; pressed: boolean; count?: number; tone?: 'default' | 'alert' }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="{ 'chip--on': pressed, 'chip--alert': tone === 'alert' }"
    :aria-pressed="pressed"
    @click="$emit('toggle')"
  >
    <span>{{ label }}</span>
    <span v-if="count !== undefined" class="chip__count">{{ count }}</span>
  </button>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font: 500 0.8125rem/1.2 var(--font-sans);
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.chip:hover {
  border-color: var(--ink);
}
.chip--on {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}
.chip--alert.chip--on {
  background: var(--alert);
  border-color: var(--alert);
  color: #000;
}
.chip__count {
  font: 400 0.75rem var(--font-mono);
  opacity: 0.85;
}
</style>
