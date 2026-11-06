<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import PlateDeck from './PlateDeck.vue'
</script>

<template>
  <Story title="widgets/PlateDeck">
    <Variant title="기본"><PlateDeck :satellites="FIXTURES" /></Variant>
  </Story>
</template>
