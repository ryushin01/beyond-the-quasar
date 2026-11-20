<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { upcomingSkyEvents, type SkyEvent } from '@/entities/sky'
import { formatUtc } from '@/shared/lib'
import { gsap, useMotionPreference, useVisibleFrameLoop } from '@/shared/motion'

import { createHeadingDrag } from '../lib/heading-drag'
import { paintSky, type LabelBox } from '../lib/sky-paint'
import { EMPTY_SKY, placeSky } from '../lib/sky-scene'
import { busiestHeading, viewScale } from '../lib/sky-view'
import SkyOverlay from './SkyOverlay.vue'

const RECOMPUTE_MS = 30_000
const TWINKLE_FRAME_MS = 1000 / 24

const { t } = useI18n()
const { enabled } = useMotionPreference()
const observer = useObserver()

const root = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const now = ref(new Date())
const heading = ref(180)
const sky = shallowRef(EMPTY_SKY)
const nextEvent = ref<SkyEvent>()

let context: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let lastFrame = 0
let clockTimer: ReturnType<typeof setInterval> | undefined
let skyTimer: ReturnType<typeof setInterval> | undefined
const reveal = { progress: 1 }
let revealTween: gsap.core.Tween | undefined
let revealed = false

const summary = computed(() =>
  t('sky.summary', {
    site: t(`sites.${observer.siteId}`),
    time: formatUtc(now.value, true),
    count: sky.value.visibleNames.length,
    names: sky.value.visibleNames.join(', '),
  }),
)

function recompute(date: Date): void {
  sky.value = placeSky(date, observer.site)
}

function draw(time = 0): void {
  if (!context) return
  paintSky(context, sky.value, {
    view: { width, height, heading: heading.value },
    time,
    twinkle: enabled.value,
    reveal: reveal.progress,
    reserved: reservedBoxes(),
    compass: { north: t('observatory.north'), east: t('observatory.east'), south: t('observatory.south'), west: t('observatory.west') },
  })
}

/** 화면 위 글자와 겹치지 않도록 이름표를 놓지 않을 영역 */
function reservedBoxes(): LabelBox[] {
  const area = root.value?.getBoundingClientRect()
  if (!area) return []
  return [...(root.value?.querySelectorAll('.sky__head, .sky__readout, .sky__end') ?? [])].map((element) => {
    const box = element.getBoundingClientRect()
    return { left: box.left - area.left, right: box.right - area.left, top: box.top - area.top, bottom: box.bottom - area.top }
  })
}

function resize(): void {
  if (!canvas.value || !context) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  width = canvas.value.clientWidth
  height = canvas.value.clientHeight
  canvas.value.width = Math.max(1, Math.round(width * ratio))
  canvas.value.height = Math.max(1, Math.round(height * ratio))
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  draw(performance.now())
}

/** 별 반짝임은 초당 24장이면 충분해 그 사이 프레임은 건너뜁니다. */
function twinkle(time: number): void {
  if (time - lastFrame < TWINKLE_FRAME_MS) return
  lastFrame = time
  draw(time)
}

function playReveal(): void {
  if (revealed) return
  revealed = true
  if (!enabled.value) return
  revealTween = gsap.fromTo(reveal, { progress: 0 }, { progress: 1, duration: 2.6, ease: 'power2.inOut' })
}

function refreshSky(): void {
  recompute(new Date())
  draw(performance.now())
}

function setInitialHeading(): void {
  heading.value = busiestHeading(sky.value.constellations.flatMap((item) => item.paths.flat()))
}

const { onPointerDown, onPointerMove, onPointerEnd } = createHeadingDrag({
  target: canvas,
  heading,
  degreesPerPixel: () => (180 / Math.PI) / viewScale(width, height) / 2,
  onTurn: () => draw(performance.now()),
})

useResizeObserver(canvas, resize)
// 하늘이 화면에 들어오고 탭이 열려 있고 모션이 허용될 때만 반짝임을 돌립니다. 처음 들어올 때 별자리선을 그려 나갑니다.
useVisibleFrameLoop(root, {
  onFrame: twinkle,
  onStill: draw,
  initiallyVisible: false,
  threshold: 0.2,
  onVisible: (visible) => {
    if (visible) playReveal()
  },
})

// 모션을 끄면 그려 나가던 별자리선을 끝까지 펼친 정지 화면으로 둡니다(루프 정지는 useVisibleFrameLoop가 맡음).
watch(enabled, (value) => {
  if (value) return
  revealTween?.kill()
  reveal.progress = 1
  draw(performance.now())
})

watch(
  () => observer.siteId,
  () => {
    recompute(new Date())
    setInitialHeading()
    draw(performance.now())
  },
)

onMounted(() => {
  context = canvas.value?.getContext('2d') ?? null
  recompute(now.value)
  setInitialHeading()
  nextEvent.value = upcomingSkyEvents(now.value)[0]
  resize()
  clockTimer = setInterval(() => (now.value = new Date()), 1000)
  skyTimer = setInterval(refreshSky, RECOMPUTE_MS)
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clearInterval(skyTimer)
  revealTween?.kill()
})
</script>

<template>
  <section ref="root" class="sky scope-dark" aria-labelledby="sky-title">
    <canvas
      ref="canvas"
      class="sky__canvas"
      role="img"
      :aria-label="summary"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerEnd"
      @pointercancel="onPointerEnd"
    />
    <SkyOverlay :now="now" :visible-names="sky.visibleNames" :next-event="nextEvent" />
  </section>
</template>

<style scoped>
.sky {
  position: relative;
  height: 100svh;
  min-height: 38rem;
  overflow: hidden;
  background: #000;
  color: #fff;
}
.sky__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}
.sky__canvas:active {
  cursor: grabbing;
}
</style>
