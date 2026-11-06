<script setup lang="ts">
import type { Satellite } from '@/entities/satellite'

import SatelliteFilterPanel from './SatelliteFilterPanel.vue'

const base = { line1: '', line2: '', launchSite: null, launchDate: null, opsStatus: '+', periodMin: null, inclinationDeg: null, rcsM2: null, epoch: new Date(), objectId: null, apogeeKm: null, perigeeKm: null, dualUse: false }
const satellites: Satellite[] = [
  { ...base, noradId: 1, name: 'AEHF-1', category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'US' },
  { ...base, noradId: 2, name: 'ISS', category: 'crewed', mission: 'crewed', orbit: 'LEO', owner: 'ISS' },
]
</script>

<template>
  <Story title="features/SatelliteFilterPanel">
    <Variant title="전체"><SatelliteFilterPanel :satellites="satellites" /></Variant>
    <Variant title="간단히"><SatelliteFilterPanel :satellites="satellites" dense /></Variant>
  </Story>
</template>
