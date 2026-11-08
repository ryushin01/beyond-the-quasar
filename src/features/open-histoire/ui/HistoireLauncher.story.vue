<script setup lang="ts">
import HistoireLauncher from './HistoireLauncher.vue'

// 스토리에서는 실제로 이동하지 않고 전환 연출만 확인합니다.
const noop = (): void => {}
</script>

<template>
  <Story title="features/HistoireLauncher" :layout="{ type: 'single', iframe: true }">
    <Variant title="기본">
      <div style="height: 320px; background: #000"><HistoireLauncher href="#histoire" :navigate="noop" /></div>
    </Variant>
  </Story>
</template>
