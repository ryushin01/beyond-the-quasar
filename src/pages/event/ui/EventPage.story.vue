<script setup lang="ts">
import EventPage from './EventPage.vue'
</script>

<template>
  <Story title="pages/event/EventPage" :layout="{ type: 'single', iframe: true }">
    <Variant title="기본"><EventPage /></Variant>
  </Story>
</template>
