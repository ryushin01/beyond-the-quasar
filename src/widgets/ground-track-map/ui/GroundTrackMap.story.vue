<script setup lang="ts">
import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import GroundTrackMap from './GroundTrackMap.vue'
</script>

<template>
  <Story title="widgets/GroundTrackMap">
    <Variant title="평면"><div style="display: flex; height: 480px"><GroundTrackMap :satellites="FIXTURES" :tracked="ISS_FIXTURE" /></div></Variant>
  </Story>
</template>
