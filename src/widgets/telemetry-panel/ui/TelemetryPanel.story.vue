<script setup lang="ts">
import { AEHF_FIXTURE, ISS_FIXTURE } from '@/entities/satellite'

import TelemetryPanel from './TelemetryPanel.vue'
</script>

<template>
  <Story title="widgets/TelemetryPanel">
    <Variant title="저궤도"><TelemetryPanel :satellite="ISS_FIXTURE" /></Variant>
    <Variant title="군사 정지궤도"><TelemetryPanel :satellite="AEHF_FIXTURE" /></Variant>
  </Story>
</template>
