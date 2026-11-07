<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import OrbitScatter from './OrbitScatter.vue'
</script>

<template>
  <Story title="widgets/OrbitScatter">
    <Variant title="기본"><OrbitScatter :satellites="FIXTURES" /></Variant>
  </Story>
</template>
