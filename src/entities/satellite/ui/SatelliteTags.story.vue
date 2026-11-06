<script setup lang="ts">
import type { Satellite } from '../model/types'
import SatelliteTags from './SatelliteTags.vue'

const satellite: Satellite = { line1: '', line2: '', launchSite: null, launchDate: null, opsStatus: '+', periodMin: null, inclinationDeg: null, rcsM2: null, epoch: new Date(), objectId: null, noradId: 31598, name: 'COSMO-SKYMED 1', category: 'military', mission: 'isr', orbit: 'LEO', owner: 'IT', dualUse: true, apogeeKm: null, perigeeKm: null }
</script>

<template>
  <Story title="entities/SatelliteTags">
    <Variant title="전체"><SatelliteTags :satellite="satellite" /></Variant>
    <Variant title="간단히"><SatelliteTags :satellite="satellite" compact /></Variant>
  </Story>
</template>
