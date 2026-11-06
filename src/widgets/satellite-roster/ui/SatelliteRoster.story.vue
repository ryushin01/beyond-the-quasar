<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import SatelliteRoster from './SatelliteRoster.vue'
</script>

<template>
  <Story title="widgets/SatelliteRoster">
    <Variant title="기본"><div style="height: 320px; display: flex"><SatelliteRoster :satellites="FIXTURES" /></div></Variant>
  </Story>
</template>
