<script setup lang="ts">
import { useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { bodyPosition, BRIGHT_STARS, CONSTELLATIONS, daysUntil, localSiderealHours, PLANETS, upcomingSkyEvents, type SkyBodyName, type SkyEvent } from '@/entities/sky'
import { ROUTES } from '@/shared/config'
import { formatLatitude, formatLongitude, formatUtc } from '@/shared/lib'
import { gsap, useMotionPreference } from '@/shared/motion'

import { busiestHeading, createFieldStars, projectToView, toAltAz, viewScale, type AltAz, type ViewFrame } from '../lib/sky-view'

interface PlacedConstellation {
  name: string
  paths: AltAz[][]
}

const FIELD_STARS = createFieldStars(1100)
const LABELLED_MAGNITUDE = 2.1
const RECOMPUTE_MS = 30_000
const TWINKLE_FRAME_MS = 1000 / 24
const LINE = 'rgb(138 168 255 / 0.62)'
const PLANET = '#8aa8ff'

const { t } = useI18n()
const { enabled } = useMotionPreference()
const observer = useObserver()

const root = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const now = ref(new Date())
const heading = ref(180)
const panelOpen = ref(false)
const visibleNames = ref<string[]>([])
const nextEvent = ref<SkyEvent>()

let context: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let constellations: PlacedConstellation[] = []
let stars: (AltAz & { name: string; magnitude: number })[] = []
let field: (AltAz & { size: number; phase: number })[] = []
let bodies: (AltAz & { name: SkyBodyName })[] = []
let frame = 0
let lastFrame = 0
let inView = false
let clockTimer: ReturnType<typeof setInterval> | undefined
let skyTimer: ReturnType<typeof setInterval> | undefined
let drag: { pointerId: number; x: number; heading: number } | null = null
const reveal = { progress: 1 }
let revealTween: gsap.core.Tween | undefined
let revealed = false

const coordinates = computed(() => `${formatLatitude(observer.site.latitude)} · ${formatLongitude(observer.site.longitude)}`)
const nextEventDays = computed(() => (nextEvent.value ? daysUntil(nextEvent.value.date, now.value) : 0))
const summary = computed(() =>
  t('sky.summary', {
    site: t(`sites.${observer.siteId}`),
    time: formatUtc(now.value, true),
    count: visibleNames.value.length,
    names: visibleNames.value.join(', '),
  }),
)

function recompute(date: Date): void {
  const site = observer.site
  const sidereal = localSiderealHours(date, site.longitude)
  const place = (ra: number, dec: number): AltAz => toAltAz(ra, dec, sidereal, site.latitude)
  constellations = CONSTELLATIONS.map((item) => ({ name: item.name, paths: item.paths.map((path) => path.map(([ra, dec]) => place(ra, dec))) }))
  stars = BRIGHT_STARS.filter((star) => star.magnitude < LABELLED_MAGNITUDE).map((star) => ({ ...place(star.ra, star.dec), name: star.name, magnitude: star.magnitude }))
  field = FIELD_STARS.map((star) => ({ ...place(star.ra, star.dec), size: star.size, phase: star.phase }))
  bodies = (['Moon', ...PLANETS] as SkyBodyName[]).map((name) => ({ ...bodyPosition(name, date, site), name }))
  visibleNames.value = constellations
    .filter((item) => {
      const points = item.paths.flat()
      return points.filter((point) => point.altitude > 0).length > points.length / 2
    })
    .map((item) => item.name)
}

function draw(time = 0): void {
  if (!context) return
  const view: ViewFrame = { width, height, heading: heading.value }
  const ctx = context
  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#fff'
  for (const star of field) {
    if (star.altitude < 0) continue
    const point = projectToView(star, view)
    if (!point || point.x < 0 || point.x > width || point.y < 0 || point.y > height) continue
    const twinkle = enabled.value ? 0.65 + 0.35 * Math.sin(time / 700 + star.phase) : 0.8
    ctx.globalAlpha = Math.min(1, 0.5 + star.size * 0.5) * twinkle
    ctx.fillRect(point.x, point.y, star.size, star.size)
  }
  ctx.globalAlpha = 1

  const names = drawConstellations(ctx, view)
  drawHorizon(ctx, view)
  const taken = reservedBoxes()
  drawCompass(ctx, view, taken)
  drawBodies(ctx, view, taken)
  drawStars(ctx, view, taken)
  drawConstellationNames(ctx, names, taken)
}

/** 화면 위 글자와 겹치지 않도록 이름표를 놓지 않을 영역 */
function reservedBoxes(): DOMRectLike[] {
  const area = root.value?.getBoundingClientRect()
  if (!area) return []
  return [...(root.value?.querySelectorAll('.sky__head, .sky__readout, .sky__end') ?? [])].map((element) => {
    const box = element.getBoundingClientRect()
    return { left: box.left - area.left, right: box.right - area.left, top: box.top - area.top, bottom: box.bottom - area.top }
  })
}

function drawConstellations(ctx: CanvasRenderingContext2D, view: ViewFrame): NameAnchor[] {
  const names: NameAnchor[] = []
  ctx.lineWidth = 1
  constellations.forEach((constellation, index) => {
    const start = (index / constellations.length) * 0.6
    const local = Math.min(1, Math.max(0, (reveal.progress - start) / 0.4))
    if (local <= 0) return
    const placed = constellation.paths.map((path) => path.map((point) => ({ point, screen: point.altitude > -8 ? projectToView(point, view) : null })))

    ctx.strokeStyle = LINE
    ctx.beginPath()
    for (const path of placed) {
      const segments = path.length - 1
      const shown = segments * local
      for (let i = 0; i < segments && i < shown; i += 1) {
        const a = path[i]!.screen
        const b = path[i + 1]!.screen
        if (!a || !b) continue
        const ratio = Math.min(1, shown - i)
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio)
      }
    }
    ctx.stroke()

    ctx.fillStyle = '#fff'
    let sumX = 0
    let sumY = 0
    let lowest = -Infinity
    let count = 0
    for (const { point, screen } of placed.flat()) {
      if (!screen || point.altitude < 0) continue
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
      sumX += screen.x
      sumY += screen.y
      lowest = Math.max(lowest, screen.y)
      count += 1
    }
    if (count >= 2 && local === 1) names.push({ text: constellation.name.toUpperCase(), x: sumX / count, y: Math.min(lowest + 20, sumY / count + 70) })
  })
  return names
}

function drawConstellationNames(ctx: CanvasRenderingContext2D, names: NameAnchor[], taken: DOMRectLike[]): void {
  ctx.font = '500 11px "Geist Mono Variable", monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgb(200 212 255 / 0.74)'
  for (const name of names) {
    const labelWidth = ctx.measureText(name.text).width
    const left = name.x - labelWidth / 2
    if (placeLabel(taken, left, name.y, labelWidth)) ctx.fillText(name.text, left, name.y)
  }
}

function drawHorizon(ctx: CanvasRenderingContext2D, view: ViewFrame): void {
  const scale = viewScale(view.width, view.height)
  const samples: { x: number; y: number }[] = []
  for (let offset = -130; offset <= 130; offset += 4) {
    const point = projectToView({ altitude: 0, azimuth: view.heading + offset }, view)
    if (point) samples.push(point)
  }
  if (samples.length < 2) return
  ctx.beginPath()
  samples.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)))
  ctx.lineTo(samples[samples.length - 1]!.x, view.height + scale)
  ctx.lineTo(samples[0]!.x, view.height + scale)
  ctx.closePath()
  ctx.fillStyle = '#000'
  ctx.fill()

  ctx.beginPath()
  samples.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)))
  ctx.strokeStyle = 'rgb(255 255 255 / 0.34)'
  ctx.stroke()
}

function drawCompass(ctx: CanvasRenderingContext2D, view: ViewFrame, taken: DOMRectLike[]): void {
  ctx.fillStyle = '#fff'
  ctx.font = '500 12px "Geist Mono Variable", monospace'
  ctx.textAlign = 'left'
  for (const [azimuth, key] of [[0, 'north'], [90, 'east'], [180, 'south'], [270, 'west']] as const) {
    const point = projectToView({ altitude: 0, azimuth }, view)
    if (!point) continue
    const text = t(`observatory.${key}`)
    if (placeLabel(taken, point.x - 6, point.y - 8, 12)) ctx.fillText(text, point.x - 6, point.y - 8)
  }
}

interface NameAnchor {
  text: string
  x: number
  y: number
}

interface DOMRectLike {
  left: number
  right: number
  top: number
  bottom: number
}

function placeLabel(taken: DOMRectLike[], x: number, y: number, labelWidth: number): boolean {
  const box = { left: x, right: x + labelWidth, top: y - 14, bottom: y + 4 }
  // 화면 밖으로 잘리는 이름표는 그리지 않습니다.
  if (box.left < 0 || box.right > width) return false
  if (taken.some((item) => box.left < item.right && box.right > item.left && box.top < item.bottom && box.bottom > item.top)) return false
  taken.push(box)
  return true
}

function drawStars(ctx: CanvasRenderingContext2D, view: ViewFrame, taken: DOMRectLike[]): void {
  ctx.textAlign = 'left'
  ctx.font = '600 15px "Archivo Variable", system-ui, sans-serif'
  const ordered = [...stars].sort((a, b) => a.magnitude - b.magnitude)
  for (const star of ordered) {
    if (star.altitude < 0) continue
    const point = projectToView(star, view)
    if (!point) continue
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(point.x, point.y, Math.max(1.8, 3.4 - star.magnitude * 0.9), 0, Math.PI * 2)
    ctx.fill()
    if (reveal.progress === 1 && placeLabel(taken, point.x + 7, point.y - 5, ctx.measureText(star.name).width)) {
      ctx.fillText(star.name, point.x + 7, point.y - 5)
    }
  }
}

function drawBodies(ctx: CanvasRenderingContext2D, view: ViewFrame, taken: DOMRectLike[]): void {
  ctx.font = '600 15px "Archivo Variable", system-ui, sans-serif'
  for (const body of bodies) {
    if (body.altitude < 0) continue
    const point = projectToView(body, view)
    if (!point) continue
    const isMoon = body.name === 'Moon'
    const color = isMoon ? '#fff' : PLANET
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(point.x, point.y, isMoon ? 7 : 3, 0, Math.PI * 2)
    ctx.fill()
    if (reveal.progress === 1 && placeLabel(taken, point.x + 11, point.y - 7, ctx.measureText(body.name).width)) {
      ctx.fillText(body.name, point.x + 11, point.y - 7)
    }
  }
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

function loop(time: number): void {
  frame = requestAnimationFrame(loop)
  if (time - lastFrame < TWINKLE_FRAME_MS) return
  lastFrame = time
  draw(time)
}

function updateLoop(): void {
  cancelAnimationFrame(frame)
  frame = 0
  if (enabled.value && inView && !document.hidden) frame = requestAnimationFrame(loop)
  else draw(performance.now())
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


function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return
  drag = { pointerId: event.pointerId, x: event.clientX, heading: heading.value }
  canvas.value?.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!drag || event.pointerId !== drag.pointerId) return
  const degreesPerPixel = (180 / Math.PI) / viewScale(width, height) / 2
  heading.value = drag.heading - (event.clientX - drag.x) * degreesPerPixel
  draw(performance.now())
}

function onPointerEnd(event: PointerEvent): void {
  if (drag?.pointerId === event.pointerId) drag = null
}

function setInitialHeading(): void {
  heading.value = busiestHeading(constellations.flatMap((item) => item.paths.flat()))
}

useResizeObserver(canvas, resize)
useIntersectionObserver(root, ([entry]) => {
  inView = entry?.isIntersecting ?? false
  if (inView) playReveal()
  updateLoop()
}, { threshold: 0.2 })

watch(enabled, (value) => {
  if (!value) {
    revealTween?.kill()
    reveal.progress = 1
  }
  updateLoop()
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
  document.addEventListener('visibilitychange', updateLoop)
  clockTimer = setInterval(() => (now.value = new Date()), 1000)
  skyTimer = setInterval(refreshSky, RECOMPUTE_MS)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  clearInterval(clockTimer)
  clearInterval(skyTimer)
  revealTween?.kill()
  document.removeEventListener('visibilitychange', updateLoop)
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

    <div class="sky__ui">
      <header class="sky__head">
        <p class="sky__eyebrow">{{ t('sky.eyebrow') }}</p>
        <h2 id="sky-title" class="sky__title">{{ t('sky.title') }}</h2>
        <p class="sky__hint">{{ t('sky.hint') }}</p>
      </header>

      <div class="sky__explain">
        <button type="button" class="sky__chip" :aria-expanded="panelOpen" aria-controls="sky-panel" @click="panelOpen = !panelOpen">
          {{ t('sky.explain') }}
        </button>
        <div v-show="panelOpen" id="sky-panel" class="sky__panel">
          <p>{{ t('sky.panelBody') }}</p>
          <p class="sky__panel-count">{{ t('sky.panelCount', { count: visibleNames.length }) }}</p>
          <ul class="sky__names">
            <li v-for="name in visibleNames" :key="name">{{ name }}</li>
          </ul>
        </div>
      </div>

      <div class="sky__readout">
        <p class="sky__label">{{ t(`sites.${observer.siteId}`) }}</p>
        <p class="sky__clock">{{ formatUtc(now) }}</p>
        <p class="sky__label">{{ now.toISOString().slice(0, 10) }} UTC</p>
        <p class="sky__label">{{ coordinates }}</p>
      </div>

      <div class="sky__end">
        <RouterLink v-if="nextEvent" :to="ROUTES.event" class="sky__event">
          <span class="sky__label">{{ t('sky.nextEvent') }}</span>
          <span class="sky__event-name">{{ t(`event.names.${nextEvent.id}`) }}</span>
          <span class="sky__label">{{ nextEvent.date.toISOString().slice(0, 10) }} · D-{{ nextEventDays }}</span>
        </RouterLink>
      </div>
    </div>
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
/* 글자 사이의 빈 곳에서도 하늘을 끌 수 있게 포인터는 조작 요소만 받습니다 */
.sky__ui {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  /* 위는 고정 헤더, 아래는 홈 진행 바만큼 비웁니다 */
  padding: calc(var(--chrome-height) + 1.5rem) var(--margin) 4.5rem;
  pointer-events: none;
}
.sky__ui a,
.sky__ui button,
.sky__panel {
  pointer-events: auto;
}
.sky__eyebrow,
.sky__label {
  margin: 0;
  color: #8a8a8a;
  font: 500 0.75rem/1.5 var(--font-mono);
  text-transform: uppercase;
}
.sky__title {
  margin: 0.125rem 0;
  font: 700 clamp(1.25rem, 2vw, 1.75rem) / 1.2 var(--font-display);
}
.sky__hint {
  margin: 0;
  color: #8a8a8a;
  font-size: 0.9375rem;
}
.sky__explain {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}
.sky__chip {
  min-height: 2.75rem;
  padding: 0 1rem;
  background: #fff;
  border: 0;
  color: #000;
  font: 700 0.8125rem var(--font-mono);
  cursor: pointer;
}
.sky__chip:hover {
  background: var(--signal-text);
}
.sky__panel {
  width: min(22rem, calc(100vw - 2 * var(--margin)));
  max-height: 46svh;
  padding: 1.25rem;
  overflow-y: auto;
  background: #000;
  border: 1px solid #fff;
  font-size: 0.9375rem;
}
.sky__panel p {
  margin: 0 0 0.75rem;
}
.sky__panel-count {
  font: 500 0.8125rem var(--font-mono);
  color: #8a8a8a;
}
.sky__names {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font: 500 0.8125rem var(--font-mono);
}
.sky__readout {
  grid-row: 3;
  align-self: end;
}
.sky__readout p {
  margin: 0;
}
.sky__clock {
  font: 500 clamp(1.5rem, 2.4vw, 2rem) / 1.25 var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.sky__end {
  grid-row: 3;
  grid-column: 2;
  align-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  /* 플로팅 버튼 자리를 비웁니다 */
  margin-right: 4.5rem;
  text-align: right;
}
.sky__event {
  display: flex;
  flex-direction: column;
  min-height: 2.75rem;
  color: #fff;
  text-decoration: none;
}
.sky__event:hover .sky__event-name {
  color: var(--signal-text);
}
.sky__event-name {
  font: 500 clamp(1.25rem, 2vw, 1.75rem) / 1.25 var(--font-mono);
  transition: color 0.25s ease;
}
@media (max-width: 719px) {
  .sky__ui {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;
  }
  .sky__explain {
    align-items: flex-start;
  }
  .sky__panel {
    max-height: 34svh;
  }
  .sky__readout {
    grid-row: 4;
  }
  .sky__end {
    grid-row: 5;
    grid-column: 1;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
