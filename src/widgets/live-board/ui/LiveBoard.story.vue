<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import LiveBoard from './LiveBoard.vue'
</script>

<template>
  <Story title="widgets/LiveBoard">
    <Variant title="기본"><LiveBoard :satellites="FIXTURES" /></Variant>
  </Story>
</template>
