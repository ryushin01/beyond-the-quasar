<script setup lang="ts">
import { AEHF_FIXTURE, ISS_FIXTURE } from '../model/fixtures'
import SatelliteWireframe from './SatelliteWireframe.vue'
</script>

<template>
  <Story title="entities/SatelliteWireframe">
    <Variant title="군사"><SatelliteWireframe :satellite="AEHF_FIXTURE" /></Variant>
    <Variant title="유인"><SatelliteWireframe :satellite="ISS_FIXTURE" /></Variant>
  </Story>
</template>
