<script setup lang="ts">
import { eyepieceScene } from '@/entities/sky'

import EyepieceView from './EyepieceView.vue'

const ATACAMA = { latitude: -24.63, longitude: -70.4, elevationM: 2635 }
const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const solarPeak = eyepieceScene('solarEclipse', new Date('2027-02-06T16:03:00Z'), ATACAMA)
const solarPartial = eyepieceScene('solarEclipse', new Date('2027-02-06T15:10:00Z'), ATACAMA)
const lunar = eyepieceScene('lunarEclipse', new Date('2027-02-20T23:12:44Z'), DAEJEON)
const lunarTotal = eyepieceScene('lunarEclipse', new Date('2028-12-31T16:52:00Z'), DAEJEON)
</script>

<template>
  <Story title="pages/observatory/EyepieceView">
    <Variant title="금환일식 절정"><div style="width: 360px; background: #000"><EyepieceView id="solarEclipse" :scene="solarPeak" /></div></Variant>
    <Variant title="부분일식 진행"><div style="width: 360px; background: #000"><EyepieceView id="solarEclipse" :scene="solarPartial" /></div></Variant>
    <Variant title="반영월식"><div style="width: 360px; background: #000"><EyepieceView id="lunarEclipse" :scene="lunar" /></div></Variant>
    <Variant title="개기월식"><div style="width: 360px; background: #000"><EyepieceView id="lunarEclipse" :scene="lunarTotal" /></div></Variant>
  </Story>
</template>
