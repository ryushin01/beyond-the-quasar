<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { gsap, useMotionPreference } from '@/shared/motion'

const { enabled } = useMotionPreference()
const root = ref<HTMLElement>()
const readout = ref('')
let moveX: ((value: number) => void) | undefined
let moveY: ((value: number) => void) | undefined

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], input, select, textarea, canvas'

function onMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || !root.value) return
  if (root.value.dataset.ready !== '1') {
    root.value.dataset.ready = '1'
    gsap.set(root.value, { x: event.clientX, y: event.clientY })
  }
  moveX?.(event.clientX)
  moveY?.(event.clientY)
  readout.value = `${String(Math.round(event.clientX)).padStart(4, '0')} ${String(Math.round(event.clientY)).padStart(4, '0')}`
  const target = event.target instanceof Element ? event.target : null
  root.value.classList.toggle('cursor--lock', Boolean(target?.closest(INTERACTIVE)))
}

function bind(): void {
  if (!root.value || !window.matchMedia('(pointer: fine)').matches) return
  moveX = gsap.quickTo(root.value, 'x', { duration: 0.28, ease: 'power3.out' })
  moveY = gsap.quickTo(root.value, 'y', { duration: 0.28, ease: 'power3.out' })
  window.addEventListener('pointermove', onMove, { passive: true })
}

function unbind(): void {
  window.removeEventListener('pointermove', onMove)
  if (root.value) delete root.value.dataset.ready
}

onMounted(() => {
  watch(enabled, (on) => (on ? bind() : unbind()), { immediate: true })
})
onBeforeUnmount(unbind)
</script>

<template>
  <!-- 시스템 커서를 대체하지 않고 그 위에 표적선을 덧붙이는 장식입니다 -->
  <div v-show="enabled" ref="root" class="cursor" aria-hidden="true">
    <span class="cursor__ring" />
    <span class="cursor__readout">{{ readout }}</span>
  </div>
</template>

<style scoped>
.cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 160;
  width: 0;
  height: 0;
  pointer-events: none;
  mix-blend-mode: difference;
  color: #fff;
  opacity: 0;
}
.cursor[data-ready='1'] {
  opacity: 1;
}
.cursor__ring {
  position: absolute;
  top: -1.125rem;
  left: -1.125rem;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid currentColor;
  transition: transform 0.35s var(--ease-out), border-radius 0.35s var(--ease-out);
}
.cursor--lock .cursor__ring {
  transform: scale(1.5) rotate(45deg);
}
.cursor__readout {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  font: 400 0.625rem var(--font-mono);
  white-space: nowrap;
}
@media (pointer: coarse) {
  .cursor {
    display: none;
  }
}
</style>
