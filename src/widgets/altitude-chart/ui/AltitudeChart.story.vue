<script setup lang="ts">
import { TARGETS } from '@/entities/sky'

import AltitudeChart from './AltitudeChart.vue'

const from = new Date('2026-11-06T09:00:00Z')
</script>

<template>
  <Story title="widgets/AltitudeChart">
    <Variant title="플레이아데스"><AltitudeChart :target="TARGETS[10]!" :from="from" /></Variant>
  </Story>
</template>
