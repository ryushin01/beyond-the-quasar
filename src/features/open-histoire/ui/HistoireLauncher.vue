<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { HISTOIRE_URL } from '@/shared/config'
import { EASE, gsap, useMotionPreference } from '@/shared/motion'

import { createWarpField, isPlainClick, type WarpState } from '../lib/warp'

const props = withDefaults(defineProps<{ href?: string; navigate?: (url: string) => void; besidePanel?: boolean }>(), {
  href: HISTOIRE_URL,
  navigate: (url: string) => window.location.assign(url),
})

const WORD = 'HISTOIRE'
const SHUTTERS = 8

const { t } = useI18n()
const { enabled } = useMotionPreference()
const launcher = ref<HTMLAnchorElement>()
const overlay = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const warping = ref(false)
const count = ref('000')
let timeline: gsap.core.Timeline | undefined

function buildTimeline(origin: { x: number; y: number }): gsap.core.Timeline {
  const draw = canvas.value ? createWarpField(canvas.value) : () => {}
  const state: WarpState = { speed: 0.002, glow: 0 }
  const counter = { value: 0 }
  const q = gsap.utils.selector(overlay.value!)
  const circle = (radius: string): string => `circle(${radius} at ${origin.x}px ${origin.y}px)`

  // 첫 단계부터 빛줄기가 보이도록 미리 몇 프레임 쌓아 둡니다.
  for (let i = 0; i < 24; i += 1) draw({ speed: 0.012, glow: 0 })

  return gsap
    .timeline({ onUpdate: () => draw(state), onComplete: () => props.navigate(props.href) })
    .fromTo(overlay.value!, { clipPath: circle('0vmax') }, { clipPath: circle('160vmax'), duration: 0.7, ease: EASE.inOut }, 0)
    .fromTo(launcher.value!, { scale: 1 }, { scale: 0.6, duration: 0.3, ease: EASE.soft }, 0)
    .to(state, { speed: 0.075, duration: 1.45, ease: 'power3.in' }, 0)
    .fromTo(q('.warp__char'), { yPercent: 120, fontStretch: '62%' }, { yPercent: 0, fontStretch: '125%', duration: 0.75, ease: EASE.out, stagger: 0.035 }, 0.28)
    .fromTo(q('.warp__line'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: EASE.inOut }, 0.32)
    .fromTo(q('.warp__meta'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.soft }, 0.5)
    .to(counter, { value: 100, duration: 1.05, ease: 'power2.in', onUpdate: () => (count.value = String(Math.round(counter.value)).padStart(3, '0')) }, 0.45)
    .to(q('.warp__title'), { scale: 1.45, duration: 1.1, ease: 'power2.in' }, 0.55)
    .to(state, { glow: 1, duration: 0.55, ease: 'power2.in' }, 1.15)
    .to(q('.warp__title'), { scale: 3.2, autoAlpha: 0, duration: 0.3, ease: 'power3.in' }, 1.42)
    .to(q('.warp__meta, .warp__line'), { autoAlpha: 0, duration: 0.2 }, 1.42)
    .fromTo(q('.warp__shutter'), { scaleY: 0 }, { scaleY: 1, duration: 0.42, ease: EASE.inOut, stagger: { each: 0.028, from: 'center' } }, 1.5)
}

async function onClick(event: MouseEvent): Promise<void> {
  if (!isPlainClick(event)) return
  event.preventDefault()
  if (warping.value) return
  if (!enabled.value) {
    props.navigate(props.href)
    return
  }
  warping.value = true
  const box = launcher.value?.getBoundingClientRect()
  await nextTick()
  timeline = buildTimeline({ x: (box?.left ?? 0) + (box?.width ?? 0) / 2, y: (box?.top ?? 0) + (box?.height ?? 0) / 2 })
}

function reset(): void {
  timeline?.kill()
  timeline = undefined
  gsap.set(launcher.value ?? [], { clearProps: 'scale' })
  warping.value = false
  count.value = '000'
}

// 브라우저 뒤로 가기로 돌아오면 멈춘 전환 화면이 남아 있지 않게 합니다.
useEventListener(window, 'pageshow', (event: PageTransitionEvent) => {
  if (event.persisted) reset()
})

onBeforeUnmount(() => timeline?.kill())
</script>

<template>
  <nav :aria-label="t('histoire.landmark')">
    <a ref="launcher" class="launcher scope-dark" :class="{ 'launcher--beside-panel': besidePanel }" :href="href" :aria-label="t('histoire.open')" @click="onClick">
      <span class="launcher__orbit" aria-hidden="true"><span class="launcher__moon" /></span>
      <span class="launcher__core" aria-hidden="true">H</span>
      <span class="launcher__label" aria-hidden="true">{{ t('histoire.label') }}</span>
    </a>
  </nav>

  <div v-if="warping" ref="overlay" class="warp scope-dark" aria-hidden="true">
    <canvas ref="canvas" class="warp__canvas" />
    <div class="warp__center">
      <p class="warp__meta">COMPONENT ARCHIVE</p>
      <p class="warp__title">
        <span v-for="(char, index) in WORD" :key="index" class="warp__clip"><span class="warp__char">{{ char }}</span></span>
      </p>
      <span class="warp__line" />
      <p class="warp__meta">JUMP {{ count }}%</p>
    </div>
    <div class="warp__shutters">
      <span v-for="index in SHUTTERS" :key="index" class="warp__shutter" />
    </div>
  </div>
</template>

<style scoped>
.launcher {
  position: fixed;
  /* 홈 진행 바와 이벤트 화면의 아래 띠를 피해 그 위에 둡니다 */
  right: var(--margin);
  bottom: max(4.25rem, calc(env(safe-area-inset-bottom) + 3.5rem));
  z-index: 45;
  display: flex;
  align-items: center;
  height: 3.5rem;
  min-width: 3.5rem;
  background: #000;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: #fff;
  text-decoration: none;
  box-shadow: 0 0 1.75rem rgb(74 120 255 / 0.4);
  transition: box-shadow 0.4s ease, border-color 0.25s ease;
}
.launcher:hover,
.launcher:focus-visible {
  border-color: #8aa8ff;
  box-shadow: 0 0 2.75rem rgb(74 120 255 / 0.75);
}
.launcher__orbit {
  position: absolute;
  left: 0.3125rem;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgb(138 168 255 / 0.5);
  border-radius: 50%;
  animation: launcher-spin 5s linear infinite;
}
.launcher__moon {
  position: absolute;
  top: -0.1875rem;
  left: calc(50% - 0.1875rem);
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: #fff;
}
.launcher__core {
  display: grid;
  flex: none;
  place-items: center;
  width: 3.375rem;
  font: 800 1.125rem var(--font-display);
  font-stretch: 125%;
}
.launcher__label {
  max-width: 0;
  overflow: hidden;
  font: 600 0.8125rem var(--font-mono);
  white-space: nowrap;
  transition: max-width 0.5s var(--ease-out), padding 0.5s var(--ease-out);
}
.launcher:hover .launcher__label,
.launcher:focus-visible .launcher__label {
  max-width: 7rem;
  padding-right: 1.25rem;
}
/* 관제 화면의 오른쪽 패널에는 탭이 있어 지도 구역 안쪽으로 옮깁니다 */
@media (min-width: 1100px) {
  .launcher--beside-panel {
    right: 24rem;
    bottom: 5.5rem;
  }
}
@keyframes launcher-spin {
  to {
    transform: rotate(360deg);
  }
}

.warp {
  position: fixed;
  inset: 0;
  z-index: 170;
  background: #00020c;
  color: #fff;
  overflow: hidden;
}
.warp__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.warp__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
}
.warp__title {
  display: flex;
  margin: 0;
  font: 800 clamp(3rem, 15vw, 15rem) / 0.9 var(--font-display);
  font-stretch: 125%;
  will-change: transform;
}
.warp__clip {
  display: block;
  overflow: hidden;
  padding-block: 0.04em;
}
.warp__char {
  display: block;
}
.warp__line {
  display: block;
  width: min(36rem, 76vw);
  height: 1px;
  background: #8aa8ff;
}
.warp__meta {
  margin: 0;
  font: 500 0.875rem var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.warp__shutters {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}
.warp__shutter {
  margin-right: -1px;
  background: #4a78ff;
  transform: scaleY(0);
  transform-origin: bottom;
}
.warp__shutter:nth-child(even) {
  background: #00020c;
}
</style>
