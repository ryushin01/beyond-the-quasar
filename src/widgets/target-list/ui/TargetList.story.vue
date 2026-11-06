<script setup lang="ts">
import TargetList from './TargetList.vue'

const date = new Date('2026-11-06T13:00:00Z')
</script>

<template>
  <Story title="widgets/TargetList">
    <Variant title="기본"><TargetList :date="date" selected-id="3c273" /></Variant>
  </Story>
</template>
