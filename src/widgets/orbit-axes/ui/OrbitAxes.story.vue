<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import OrbitAxes from './OrbitAxes.vue'
</script>

<template>
  <Story title="widgets/OrbitAxes">
    <Variant title="기본"><OrbitAxes :satellites="FIXTURES" /></Variant>
  </Story>
</template>
