<script setup lang="ts">
import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import PassTimeline from './PassTimeline.vue'
</script>

<template>
  <Story title="widgets/PassTimeline">
    <Variant title="기본"><div style="max-width: 23rem"><PassTimeline :satellite="ISS_FIXTURE" :satellites="FIXTURES" /></div></Variant>
  </Story>
</template>
