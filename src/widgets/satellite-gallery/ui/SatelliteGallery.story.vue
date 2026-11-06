<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import SatelliteGallery from './SatelliteGallery.vue'
</script>

<template>
  <Story title="widgets/SatelliteGallery">
    <Variant title="기본"><SatelliteGallery :satellites="FIXTURES" /></Variant>
  </Story>
</template>
