<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import OrbitGlobe from './OrbitGlobe.vue'
</script>

<template>
  <Story title="widgets/OrbitGlobe">
    <Variant title="기본"><OrbitGlobe :satellites="FIXTURES" /></Variant>
  </Story>
</template>
