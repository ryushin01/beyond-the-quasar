<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { EASE, gsap, introDone, useMotionPreference } from '@/shared/motion'

const STORAGE_KEY = 'btq:intro-seen'
const COLUMNS = 12
const ROWS = 7

const { enabled } = useMotionPreference()
const visible = ref(false)
const count = ref('000')

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

onMounted(() => {
  if (!enabled.value || alreadySeen()) {
    introDone.value = true
    return
  }
  visible.value = true
  requestAnimationFrame(() => {
    const state = { value: 0 }
    gsap
      .timeline({
        onComplete: () => {
          visible.value = false
          try {
            sessionStorage.setItem(STORAGE_KEY, '1')
          } catch {
            // 저장하지 못해도 다음 방문에 다시 재생할 뿐입니다.
          }
        },
      })
      .to(state, {
        value: 100,
        duration: 1.3,
        ease: 'power2.inOut',
        onUpdate: () => (count.value = String(Math.round(state.value)).padStart(3, '0')),
      })
      .from('.loader__dot', { scale: 0, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to('.loader__label', { opacity: 0, duration: 0.2 })
      .call(() => {
        introDone.value = true
      })
      .to('.loader__cell', {
        autoAlpha: 0,
        duration: 0.32,
        ease: EASE.soft,
        stagger: { grid: [ROWS, COLUMNS], from: 'center', amount: 0.6 },
      })
  })
})
</script>

<template>
  <div v-if="visible" class="loader" aria-hidden="true">
    <div class="loader__grid">
      <span v-for="index in COLUMNS * ROWS" :key="index" class="loader__cell" />
    </div>
    <div class="loader__label">
      <span class="loader__dot" />
      <span class="loader__count">{{ count }}</span>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 150;
  pointer-events: none;
}
.loader__grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(7, 1fr);
  width: 100%;
  height: 100%;
}
.loader__cell {
  background: var(--paper);
  /* 칸 사이가 벌어지지 않도록 조금 겹칩니다 */
  outline: 1px solid var(--paper);
  box-shadow: inset 0 0 0 0.5px var(--line);
}
.loader__label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.loader__dot {
  grid-area: 1 / 1;
  width: min(40vw, 18rem);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--signal);
}
.loader__count {
  grid-area: 1 / 1;
  color: var(--ink);
  font: 500 clamp(2rem, 6vw, 4rem) var(--font-mono);
  font-variant-numeric: tabular-nums;
  mix-blend-mode: difference;
}
</style>
