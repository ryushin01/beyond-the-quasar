<script setup lang="ts">
import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import MissionPanels from './MissionPanels.vue'
</script>

<template>
  <Story title="widgets/MissionPanels">
    <Variant title="기본"><div style="display: flex; height: 460px"><MissionPanels :satellite="ISS_FIXTURE" :satellites="FIXTURES" /></div></Variant>
  </Story>
</template>
