<script setup lang="ts">
import NightBrief from './NightBrief.vue'

const date = new Date('2026-11-06T00:00:00Z')
const full = new Date('2026-08-28T04:00:00Z')
</script>

<template>
  <Story title="widgets/NightBrief">
    <Variant title="기본"><NightBrief :date="date" /></Variant>
    <Variant title="보름달"><NightBrief :date="full" /></Variant>
  </Story>
</template>
