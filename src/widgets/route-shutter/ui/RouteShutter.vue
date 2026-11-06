<script setup lang="ts">
import { ref } from 'vue'

import { EASE, gsap, useMotionPreference } from '@/shared/motion'

const COLUMNS = 8
const { enabled } = useMotionPreference()
const root = ref<HTMLElement>()

function columns(): Element[] {
  return root.value ? [...root.value.children] : []
}

/** 격자 기둥이 아래에서 올라와 화면을 덮습니다. */
function cover(): Promise<void> {
  if (!enabled.value) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.set(columns(), { transformOrigin: 'bottom', scaleY: 0 })
    gsap.to(columns(), { scaleY: 1, duration: 0.5, ease: EASE.inOut, stagger: 0.03, onComplete: resolve })
  })
}

/** 기둥이 위로 빠지며 새 화면을 드러냅니다. */
function reveal(): Promise<void> {
  if (!enabled.value) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.set(columns(), { transformOrigin: 'top' })
    gsap.to(columns(), { scaleY: 0, duration: 0.55, ease: EASE.inOut, stagger: 0.03, onComplete: resolve })
  })
}

defineExpose({ cover, reveal })
</script>

<template>
  <div ref="root" class="shutter" aria-hidden="true">
    <span v-for="index in COLUMNS" :key="index" class="shutter__col" />
  </div>
</template>

<style scoped>
.shutter {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  pointer-events: none;
}
.shutter__col {
  display: block;
  margin-right: -1px;
  background: var(--signal);
  transform: scaleY(0);
}
.shutter__col:nth-child(even) {
  background: var(--ink);
}
</style>
