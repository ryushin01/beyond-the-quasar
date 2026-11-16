<script setup lang="ts">
import StaleSnapshotNotice from './StaleSnapshotNotice.vue'
</script>

<template>
  <Story title="entities/StaleSnapshotNotice">
    <Variant title="14일 지남"><StaleSnapshotNotice :days="14" /></Variant>
  </Story>
</template>
