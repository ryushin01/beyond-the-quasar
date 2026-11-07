<script setup lang="ts">
import HomeProgress from './HomeProgress.vue'

const stops = [
  { id: 'story-a', label: '빛' },
  { id: 'story-b', label: '궤도 자산' },
  { id: 'story-c', label: '상황판' },
]
</script>

<template>
  <Story title="widgets/HomeProgress">
    <Variant title="기본">
      <div v-for="stop in stops" :id="stop.id" :key="stop.id" tabindex="-1" style="height: 100vh; padding: 2rem">{{ stop.label }}</div>
      <HomeProgress :stops="stops" />
    </Variant>
  </Story>
</template>
