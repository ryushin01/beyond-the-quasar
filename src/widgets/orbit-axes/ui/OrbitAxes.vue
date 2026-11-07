<script setup lang="ts">
import { useElementVisibility, useResizeObserver } from '@vueuse/core'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import landTopology from 'world-atlas/land-110m.json'

import { useMissionClock } from '@/entities/clock'
import { SITES } from '@/entities/observer'
import { stateAt, toSatrec, type Satellite } from '@/entities/satellite'
import { gsap, ScrollTrigger, useMotionPreference } from '@/shared/motion'

import { landDots, projectToView } from '../lib/globe'

const props = defineProps<{ satellites: Satellite[] }>()

const { t } = useI18n()
const clock = useMissionClock()
const { enabled } = useMotionPreference()

const root = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const visible = useElementVisibility(root)

const STATION = SITES[0]!
/** 연출이 끝난 모습이자 모션을 껐을 때의 모습입니다. 대전을 바라봅니다. */
const HOME_VIEW = { longitude: STATION.longitude, latitude: 24 }
const view = { ...HOME_VIEW }

const militaryCount = computed(() => props.satellites.filter((item) => item.category === 'military').length)
const otherCount = computed(() => props.satellites.length - militaryCount.value)

const satrecs = computed(() =>
  props.satellites.map((item) => ({ military: item.category === 'military', satrec: toSatrec(item.line1, item.line2) })),
)
const second = computed(() => Math.floor(clock.now.getTime() / 1000))

let dots: [number, number][] | null = null
let positions: { longitude: number; latitude: number; military: boolean }[] = []
let positionsAt = -1
let frame = 0
let context: gsap.Context | undefined

/** 육지 판정은 지도를 한 번 그려 둔 픽셀로 합니다. 점마다 다각형을 검사하는 것보다 훨씬 빠릅니다. */
function buildDots(): [number, number][] {
  const width = 720
  const height = 360
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const context2d = offscreen.getContext('2d', { willReadFrequently: true })
  if (!context2d) return []
  const topology = landTopology as unknown as Topology<{ land: GeometryCollection }>
  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI))
  context2d.beginPath()
  geoPath(projection, context2d)(feature(topology, topology.objects.land))
  context2d.fill()
  const pixels = context2d.getImageData(0, 0, width, height).data
  return landDots((longitude, latitude) => {
    const x = Math.min(width - 1, Math.floor(((longitude + 180) / 360) * width))
    const y = Math.min(height - 1, Math.floor(((90 - latitude) / 180) * height))
    return pixels[(y * width + x) * 4 + 3]! > 128
  })
}

function updatePositions(): void {
  if (positionsAt === second.value) return
  positionsAt = second.value
  positions = satrecs.value.flatMap(({ military, satrec }) => {
    const state = stateAt(satrec, clock.now)
    return state ? [{ longitude: state.longitude, latitude: state.latitude, military }] : []
  })
}

function draw(): void {
  frame = 0
  const element = canvas.value
  const context2d = element?.getContext('2d')
  if (!element || !context2d || !visible.value) return

  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const size = element.clientWidth
  if (!size) return
  if (element.width !== Math.round(size * ratio)) {
    element.width = element.height = Math.round(size * ratio)
  }
  context2d.setTransform(ratio, 0, 0, ratio, 0, 0)
  context2d.clearRect(0, 0, size, size)

  const center = size / 2
  // 대기 빛이 번질 자리를 남겨 둡니다.
  const radius = size / 2.5
  const style = getComputedStyle(element)
  const signal = style.getPropertyValue('--signal').trim() || '#4a78ff'
  const signalText = style.getPropertyValue('--signal-text').trim() || '#8aa8ff'
  const alert = style.getPropertyValue('--alert').trim() || '#ffb224'

  const glow = context2d.createRadialGradient(center, center, radius * 0.92, center, center, size / 2)
  glow.addColorStop(0, signal)
  glow.addColorStop(1, 'transparent')
  context2d.globalAlpha = 0.5
  context2d.fillStyle = glow
  context2d.fillRect(0, 0, size, size)
  context2d.globalAlpha = 1

  context2d.beginPath()
  context2d.arc(center, center, radius, 0, Math.PI * 2)
  context2d.fillStyle = '#050507'
  context2d.fill()

  dots ??= buildDots()
  const dotSize = Math.max(1, size / 420)
  context2d.fillStyle = '#fff'
  for (const [longitude, latitude] of dots) {
    const point = projectToView(longitude, latitude, view)
    if (point.z <= 0) continue
    context2d.globalAlpha = 0.14 + 0.5 * point.z
    context2d.fillRect(center + point.x * radius, center - point.y * radius, dotSize, dotSize)
  }
  context2d.globalAlpha = 1

  context2d.beginPath()
  context2d.arc(center, center, radius, 0, Math.PI * 2)
  context2d.strokeStyle = signalText
  context2d.lineWidth = 1
  context2d.stroke()

  updatePositions()
  const mark = Math.max(2.5, size / 170)
  for (const item of positions) {
    const point = projectToView(item.longitude, item.latitude, view)
    if (point.z <= 0) continue
    const x = center + point.x * radius
    const y = center - point.y * radius
    context2d.beginPath()
    if (item.military) {
      context2d.moveTo(x, y - mark * 1.3)
      context2d.lineTo(x + mark * 1.3, y)
      context2d.lineTo(x, y + mark * 1.3)
      context2d.lineTo(x - mark * 1.3, y)
      context2d.closePath()
      context2d.fillStyle = alert
    } else {
      context2d.arc(x, y, mark * 0.8, 0, Math.PI * 2)
      context2d.fillStyle = signalText
    }
    context2d.fill()
  }

  const station = projectToView(STATION.longitude, STATION.latitude, view)
  if (station.z > 0) {
    context2d.strokeStyle = '#fff'
    context2d.lineWidth = 1.5
    context2d.strokeRect(center + station.x * radius - mark * 1.5, center - station.y * radius - mark * 1.5, mark * 3, mark * 3)
  }
}

function requestDraw(): void {
  if (!frame) frame = requestAnimationFrame(draw)
}

function build(): void {
  context?.revert()
  context = undefined
  Object.assign(view, HOME_VIEW)
  requestDraw()
  if (!enabled.value) return
  context = gsap.context(() => {
    const media = gsap.matchMedia()
    // 큰 화면에서는 화면을 붙잡고, 좁은 화면에서는 스크롤을 막지 않고 지나가며 움직입니다.
    media.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, (self) => {
      const wide = self.conditions?.wide
      const timeline = gsap.timeline({
        scrollTrigger: wide
          ? { trigger: root.value, start: 'top top', end: '+=140%', pin: true, scrub: 0.5 }
          : { trigger: root.value, start: 'top bottom', end: 'center center', scrub: 0.5 },
      })
      timeline
        .fromTo(
          view,
          { longitude: HOME_VIEW.longitude - 150, latitude: 4 },
          { ...HOME_VIEW, duration: 1, ease: 'power2.out', onUpdate: requestDraw },
          0,
        )
        .fromTo('.axes__globe', { scale: 0.72 }, { scale: 1, duration: 1, ease: 'power2.out' }, 0)
        .fromTo('.axes__side--start', { xPercent: wide ? -70 : -30, autoAlpha: 0.2 }, { xPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0)
        .fromTo('.axes__side--end', { xPercent: wide ? 70 : 30, autoAlpha: 0.2 }, { xPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0)
        // 다 모인 모습을 잠시 보여 줍니다.
        .to({}, { duration: 0.25 })
    })
  }, root.value)
  ScrollTrigger.refresh()
}

useResizeObserver(canvas, requestDraw)
watch([second, visible, satrecs], requestDraw)
watch(satrecs, () => (positionsAt = -1))

onMounted(() => {
  clock.start()
  watch(enabled, build, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => {
  clock.stop()
  cancelAnimationFrame(frame)
  context?.revert()
})
</script>

<template>
  <section ref="root" class="axes scope-dark" aria-labelledby="axes-title">
    <h2 id="axes-title" class="axes__title">{{ t('home.axesTitle') }}</h2>
    <div class="axes__stage">
      <div class="axes__side axes__side--start">
        <p class="axes__word">{{ t('home.axesControl') }}</p>
        <p class="axes__sub">{{ t('home.axesControlSub') }}</p>
      </div>
      <canvas
        ref="canvas"
        class="axes__globe"
        role="img"
        :aria-label="t('home.axesGlobe', { total: satellites.length, military: militaryCount })"
      />
      <div class="axes__side axes__side--end">
        <p class="axes__word">{{ t('home.axesObserve') }}</p>
        <p class="axes__sub">{{ t('home.axesObserveSub') }}</p>
      </div>
    </div>
    <ul class="axes__legend">
      <li><span class="axes__mark axes__mark--military" aria-hidden="true" />{{ t('home.axesMilitary', { n: militaryCount }) }}</li>
      <li><span class="axes__mark axes__mark--other" aria-hidden="true" />{{ t('home.axesOther', { n: otherCount }) }}</li>
      <li><span class="axes__mark axes__mark--station" aria-hidden="true" />{{ t('home.axesStation') }}</li>
      <li class="axes__note">{{ t('home.axesNote') }}</li>
    </ul>
  </section>
</template>

<style scoped>
.axes {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  min-height: 100svh;
  padding: calc(var(--chrome-height) + 1rem) var(--margin) 4.5rem;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
}
.axes__title {
  margin: 0;
  color: var(--muted);
  font: 500 0.8125rem var(--font-mono);
  text-align: center;
}
.axes__stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0;
}
.axes__globe {
  display: block;
  width: min(46vw, 100svh - var(--chrome-height) - 9rem);
  aspect-ratio: 1;
}
.axes__side--end {
  text-align: right;
}
.axes__word {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5.6vw, 6.5rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}
.axes__sub {
  margin: 0.75rem 0 0;
  color: var(--muted);
  font-size: 0.9375rem;
}
.axes__legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 1.25rem;
  margin: 0;
  padding: 0;
  color: var(--muted);
  font: 500 0.75rem var(--font-mono);
  list-style: none;
}
.axes__legend li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.axes__mark {
  width: 0.5625rem;
  height: 0.5625rem;
}
.axes__mark--military {
  background: var(--alert);
  transform: rotate(45deg);
}
.axes__mark--other {
  background: var(--signal-text);
  border-radius: 50%;
}
.axes__mark--station {
  border: 1.5px solid #fff;
}
@media (max-width: 899px) {
  .axes__stage {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: 0.5rem;
  }
  .axes__side {
    width: 100%;
  }
  .axes__globe {
    width: min(88vw, 44svh);
  }
}
</style>
