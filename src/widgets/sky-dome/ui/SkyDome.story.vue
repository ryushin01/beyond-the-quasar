<script setup lang="ts">
import { FIXTURES } from '@/entities/satellite'

import SkyDome from './SkyDome.vue'

const date = new Date('2026-11-06T13:00:00Z')
</script>

<template>
  <Story title="widgets/SkyDome">
    <Variant title="대전, 밤"><div style="max-width: 560px"><SkyDome :date="date" selected-id="m45" :satellites="FIXTURES" /></div></Variant>
  </Story>
</template>
