<script setup lang="ts">
import type { Satellite } from '../model/types'
import SatellitePlate from './SatellitePlate.vue'

const base = { line1: '', line2: '', launchSite: 'AFETR', launchDate: '2010-08-14', opsStatus: '+', periodMin: 1436, inclinationDeg: 3, rcsM2: null, epoch: new Date(), objectId: '2010-039A' }
const military = { ...base, noradId: 36868, name: 'AEHF-1 (USA 214)', category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'US', dualUse: false, apogeeKm: 35800, perigeeKm: 35780 } satisfies Satellite
const crewed = { ...base, noradId: 25544, name: 'ISS (ZARYA)', category: 'crewed', mission: 'crewed', orbit: 'LEO', owner: 'ISS', dualUse: false, apogeeKm: 420, perigeeKm: 410 } satisfies Satellite
</script>

<template>
  <Story title="entities/SatellitePlate">
    <Variant title="군사"><div style="width: 280px"><SatellitePlate :satellite="military" /></div></Variant>
    <Variant title="유인"><div style="width: 280px"><SatellitePlate :satellite="crewed" /></div></Variant>
  </Story>
</template>
