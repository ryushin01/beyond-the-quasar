<script setup lang="ts">
import { ref } from 'vue'

import ToggleChip from './ToggleChip.vue'

const on = ref(true)
const off = ref(false)
</script>

<template>
  <Story title="shared/ToggleChip">
    <Variant title="선택">
      <ToggleChip label="군사" :count="66" :pressed="on" tone="alert" @toggle="on = !on" />
    </Variant>
    <Variant title="미선택">
      <ToggleChip label="항법" :count="28" :pressed="off" @toggle="off = !off" />
    </Variant>
  </Story>
</template>
