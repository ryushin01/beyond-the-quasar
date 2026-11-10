<script setup lang="ts">
import { ref } from 'vue'

import { eclipseWindow } from '@/entities/sky'

import EclipsePanel from './EclipsePanel.vue'

const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const lunar = eclipseWindow('lunarEclipse', new Date('2027-02-20T23:12:44Z'), DAEJEON)!
const offset = ref(0)
</script>

<template>
  <Story title="pages/observatory/EclipsePanel">
    <Variant title="반영월식(대전)"><EclipsePanel v-model:offset="offset" :eclipse="lunar" :date="new Date(lunar.peak.getTime() + offset * 60_000)" /></Variant>
  </Story>
</template>
