<script setup lang="ts">
import { ref } from 'vue'

import RouteShutter from './RouteShutter.vue'

const shutter = ref<InstanceType<typeof RouteShutter>>()
async function play(): Promise<void> {
  await shutter.value?.cover()
  await shutter.value?.reveal()
}
</script>

<template>
  <Story title="widgets/RouteShutter">
    <Variant title="재생">
      <button type="button" @click="play">재생</button>
      <RouteShutter ref="shutter" />
    </Variant>
  </Story>
</template>
