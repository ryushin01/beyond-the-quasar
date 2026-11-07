<script setup lang="ts">
import { ISS_FIXTURE } from '@/entities/satellite'

import WatchToggle from './WatchToggle.vue'
</script>

<template>
  <Story title="features/WatchToggle">
    <Variant title="기본"><WatchToggle :satellite="ISS_FIXTURE" /></Variant>
  </Story>
</template>
