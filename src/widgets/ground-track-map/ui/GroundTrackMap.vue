<script setup lang="ts">
import { symSharpAdd, symSharpRemove } from '@quasar/extras/material-symbols-sharp'
import { useResizeObserver } from '@vueuse/core'
import { geoCircle, geoGraticule10, geoNaturalEarth1, geoOrthographic, geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom as d3Zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import landTopology from 'world-atlas/land-110m.json'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { useObserver } from '@/entities/observer'
import { footprintRadiusDeg, groundTrack, orbitalPeriodMin, stateAt, toSatrec, type Satellite } from '@/entities/satellite'
import { subsolarPoint } from '@/entities/sky'
import { formatLatitude, formatLongitude, formatNumber } from '@/shared/lib'
import { gsap, useMotionPreference } from '@/shared/motion'

type Mode = 'flat' | 'globe'

const props = defineProps<{ satellites: Satellite[]; tracked: Satellite | null }>()
const emit = defineEmits<{ select: [noradId: number] }>()

const { t } = useI18n()
const clock = useMissionClock()
const observer = useObserver()
const { enabled } = useMotionPreference()

const canvas = ref<HTMLCanvasElement>()
const marker = ref<HTMLElement>()
const mode = ref<Mode>('flat')
const size = shallowRef({ width: 0, height: 0 })
const hovered = ref<{ name: string; x: number; y: number } | null>(null)

const topology = landTopology as unknown as Topology<{ land: GeometryCollection }>
const land = feature(topology, topology.objects.land)
const graticule = geoGraticule10()

const rotation = { lambda: -127, phi: -20 }
let transform = zoomIdentity
let lastTransform = zoomIdentity
let zoomBehavior: ZoomBehavior<HTMLCanvasElement, unknown> | null = null
let userMovedGlobe = false
let globeTurning = false
let positions: { satellite: Satellite; x: number; y: number }[] = []
let trackCache: { key: string; past: GeoPermissibleObjects; future: GeoPermissibleObjects } | null = null

const trackedState = computed(() => (props.tracked ? stateAt(toSatrec(props.tracked.line1, props.tracked.line2), clock.now) : null))

const summary = computed(() =>
  props.tracked && trackedState.value
    ? t('a11y.mapSummary', {
        name: props.tracked.name,
        lat: formatLatitude(trackedState.value.latitude),
        lon: formatLongitude(trackedState.value.longitude),
        alt: formatNumber(trackedState.value.altitudeKm),
        count: props.satellites.length,
      })
    : t('control.map'),
)

function buildProjection(): GeoProjection {
  const { width, height } = size.value
  if (mode.value === 'globe') {
    const radius = (Math.min(width, height) / 2 - 12) * transform.k
    return geoOrthographic().translate([width / 2, height / 2]).scale(radius).rotate([rotation.lambda, rotation.phi, 0]).clipAngle(90)
  }
  const base = geoNaturalEarth1().fitExtent([[8, 8], [width - 8, height - 8]], { type: 'Sphere' })
  const [tx, ty] = base.translate()
  return base.scale(base.scale() * transform.k).translate([tx * transform.k + transform.x, ty * transform.k + transform.y])
}

function trackGeometry(satellite: Satellite): { past: GeoPermissibleObjects; future: GeoPermissibleObjects } {
  const key = `${satellite.noradId}:${Math.floor(clock.now.getTime() / 15_000)}`
  if (trackCache?.key === key) return trackCache
  const period = orbitalPeriodMin(satellite.line2)
  const track = groundTrack(toSatrec(satellite.line1, satellite.line2), clock.now, {
    pastMin: period * 0.4,
    futureMin: period,
    stepSec: Math.max(20, (period * 60) / 150),
  })
  trackCache = {
    key,
    past: { type: 'LineString', coordinates: track.past },
    future: { type: 'LineString', coordinates: track.future },
  }
  return trackCache
}

function draw(): void {
  const element = canvas.value
  const context = element?.getContext('2d')
  if (!element || !context || size.value.width === 0) return

  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const { width, height } = size.value
  if (element.width !== Math.round(width * ratio)) element.width = Math.round(width * ratio)
  if (element.height !== Math.round(height * ratio)) element.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)

  const style = getComputedStyle(element)
  const ink = style.getPropertyValue('--ink').trim()
  const line = style.getPropertyValue('--line').trim()
  const lineStrong = style.getPropertyValue('--line-strong').trim()
  const signal = style.getPropertyValue('--signal').trim()
  const alert = style.getPropertyValue('--alert').trim()
  const raised = style.getPropertyValue('--raised').trim()
  const night = style.getPropertyValue('--night').trim()

  const projection = buildProjection()
  const path = geoPath(projection, context)

  context.beginPath()
  path({ type: 'Sphere' })
  context.fillStyle = raised
  context.fill()

  context.beginPath()
  path(land)
  context.fillStyle = lineStrong
  context.fill()

  context.beginPath()
  path(graticule)
  context.strokeStyle = line
  context.lineWidth = 0.5
  context.stroke()

  // 밤 지역: 태양 반대쪽을 중심으로 한 원
  const sun = subsolarPoint(clock.now)
  context.beginPath()
  path(geoCircle().center([sun.longitude + 180, -sun.latitude]).radius(90)())
  context.fillStyle = night
  context.fill()

  context.beginPath()
  path({ type: 'Sphere' })
  context.strokeStyle = lineStrong
  context.lineWidth = 1
  context.stroke()

  // 추적 위성의 궤적과 가시 범위
  if (props.tracked && trackedState.value) {
    const { past, future } = trackGeometry(props.tracked)
    context.beginPath()
    path(past)
    context.strokeStyle = ink
    context.globalAlpha = 0.4
    context.lineWidth = 1
    context.setLineDash([])
    context.stroke()
    context.globalAlpha = 1

    context.beginPath()
    path(future)
    context.strokeStyle = signal
    context.lineWidth = 1.5
    context.setLineDash([6, 4])
    context.stroke()
    context.setLineDash([])

    context.beginPath()
    path(
      geoCircle()
        .center([trackedState.value.longitude, trackedState.value.latitude])
        .radius(footprintRadiusDeg(trackedState.value.altitudeKm))(),
    )
    context.fillStyle = signal
    context.globalAlpha = 0.14
    context.fill()
    context.globalAlpha = 1
    context.strokeStyle = signal
    context.lineWidth = 1
    context.stroke()
  }

  // 전체 위성. 모양으로도 구분합니다 (군사: 마름모, 기타: 원)
  const visibleTest = (longitude: number, latitude: number): [number, number] | null => {
    if (mode.value === 'globe') {
      const test = geoPath(projection)({ type: 'Point', coordinates: [longitude, latitude] })
      if (test === null) return null
    }
    return projection([longitude, latitude])
  }

  positions = []
  for (const satellite of props.satellites) {
    const state = stateAt(toSatrec(satellite.line1, satellite.line2), clock.now)
    if (!state) continue
    const point = visibleTest(state.longitude, state.latitude)
    if (!point) continue
    const [x, y] = point
    positions.push({ satellite, x, y })
    if (satellite.noradId === props.tracked?.noradId) continue
    if (satellite.category === 'military') {
      context.fillStyle = alert
      context.beginPath()
      context.moveTo(x, y - 4)
      context.lineTo(x + 4, y)
      context.lineTo(x, y + 4)
      context.lineTo(x - 4, y)
      context.closePath()
      context.fill()
    } else {
      context.fillStyle = ink
      context.beginPath()
      context.arc(x, y, 2, 0, Math.PI * 2)
      context.fill()
    }
  }

  // 지상국
  const site = observer.site
  const sitePoint = visibleTest(site.longitude, site.latitude)
  if (sitePoint) {
    context.strokeStyle = ink
    context.lineWidth = 1.5
    context.strokeRect(sitePoint[0] - 4, sitePoint[1] - 4, 8, 8)
  }

  // 추적 위성은 CSS로 깜빡이는 DOM 표식으로 올립니다.
  if (marker.value) {
    const point = trackedState.value ? visibleTest(trackedState.value.longitude, trackedState.value.latitude) : null
    marker.value.style.display = point ? 'block' : 'none'
    if (point) marker.value.style.transform = `translate(${point[0]}px, ${point[1]}px)`
  }
}

/** 지구본이 추적 위성을 향해 돌아갑니다. */
function followTracked(animated: boolean): void {
  if (mode.value !== 'globe' || !trackedState.value) return
  globeTurning = false
  const target = { lambda: -trackedState.value.longitude, phi: -trackedState.value.latitude * 0.7 }
  const delta = ((target.lambda - rotation.lambda + 540) % 360) - 180
  gsap.killTweensOf(rotation)
  if (animated && enabled.value) {
    globeTurning = true
    gsap.to(rotation, {
      lambda: rotation.lambda + delta,
      phi: target.phi,
      duration: 1.1,
      ease: 'expo.out',
      onUpdate: draw,
      onComplete: () => (globeTurning = false),
    })
  } else {
    rotation.lambda += delta
    rotation.phi = target.phi
    draw()
  }
}

function setupZoom(): void {
  if (!canvas.value) return
  zoomBehavior = d3Zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([1, 8])
    // 터치에서는 두 손가락만 지도를 조작하고, 한 손가락은 페이지 스크롤에 양보합니다.
    .filter((event: Event) => {
      if (event.type === 'wheel') return window.matchMedia('(min-width: 1100px)').matches
      if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) return event.touches.length >= 2
      return !(event as MouseEvent).button
    })
    .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      if (mode.value === 'globe') {
        const k = event.transform.k
        rotation.lambda += ((event.transform.x - lastTransform.x) * 0.3) / k
        rotation.phi = Math.max(-85, Math.min(85, rotation.phi - ((event.transform.y - lastTransform.y) * 0.3) / k))
        if (event.sourceEvent) userMovedGlobe = true
      }
      lastTransform = event.transform
      transform = event.transform
      draw()
    })
  select(canvas.value).call(zoomBehavior).style('touch-action', 'pan-y').on('dblclick.zoom', null)
}

function zoomBy(factor: number): void {
  if (canvas.value && zoomBehavior) select(canvas.value).call(zoomBehavior.scaleBy, factor)
}

function setMode(next: Mode): void {
  if (mode.value === next) return
  mode.value = next
  userMovedGlobe = false
  if (canvas.value && zoomBehavior) select(canvas.value).call(zoomBehavior.transform, zoomIdentity)
  followTracked(false)
  draw()
}

function nearest(event: MouseEvent): { satellite: Satellite; x: number; y: number } | null {
  const box = canvas.value?.getBoundingClientRect()
  if (!box) return null
  const x = event.clientX - box.left
  const y = event.clientY - box.top
  let best: { satellite: Satellite; x: number; y: number } | null = null
  let bestDistance = 14
  for (const position of positions) {
    const distance = Math.hypot(position.x - x, position.y - y)
    if (distance < bestDistance) {
      best = position
      bestDistance = distance
    }
  }
  return best
}

function onPointerMove(event: MouseEvent): void {
  const hit = nearest(event)
  hovered.value = hit ? { name: hit.satellite.name, x: hit.x, y: hit.y } : null
  if (canvas.value) canvas.value.style.cursor = hit ? 'pointer' : 'grab'
}

function onClick(event: MouseEvent): void {
  const hit = nearest(event)
  if (hit) emit('select', hit.satellite.noradId)
}

useResizeObserver(canvas, (entries) => {
  const box = entries[0]?.contentRect
  if (!box) return
  size.value = { width: box.width, height: box.height }
  draw()
})

onMounted(() => {
  setupZoom()
  draw()
})

watch(
  () => clock.now,
  () => {
    if (mode.value === 'globe' && !userMovedGlobe && !globeTurning) followTracked(false)
    else if (!globeTurning) draw()
  },
)
watch(() => props.tracked?.noradId, () => {
  trackCache = null
  userMovedGlobe = false
  followTracked(true)
  draw()
})
watch(() => [props.satellites, observer.siteId], draw)

</script>

<template>
  <div class="map">
    <canvas
      ref="canvas"
      class="map__canvas"
      role="img"
      :aria-label="summary"
      @mousemove="onPointerMove"
      @mouseleave="hovered = null"
      @click="onClick"
    />
    <div ref="marker" class="map__marker" aria-hidden="true">
      <span class="map__pulse" />
      <span class="map__pulse map__pulse--late" />
      <span class="map__core" />
      <span class="map__callout">{{ tracked?.name }}</span>
    </div>
    <p v-if="hovered" class="map__tip" aria-hidden="true" :style="{ transform: `translate(${hovered.x}px, ${hovered.y}px)` }">{{ hovered.name }}</p>

    <div class="map__tools">
      <div class="map__group" role="group" :aria-label="t('control.projection')">
        <button type="button" class="map__btn map__btn--text" :aria-pressed="mode === 'flat'" @click="setMode('flat')">{{ t('control.flat') }}</button>
        <button type="button" class="map__btn map__btn--text" :aria-pressed="mode === 'globe'" @click="setMode('globe')">{{ t('control.globe') }}</button>
      </div>
      <div class="map__group">
        <button type="button" class="map__btn" :aria-label="t('control.zoomIn')" @click="zoomBy(1.5)"><q-icon :name="symSharpAdd" size="1.125rem" /></button>
        <button type="button" class="map__btn" :aria-label="t('control.zoomOut')" @click="zoomBy(1 / 1.5)"><q-icon :name="symSharpRemove" size="1.125rem" /></button>
      </div>
    </div>

    <ul class="map__legend">
      <li><span class="key key--tracked" aria-hidden="true" />{{ t('control.legendTracked') }}</li>
      <li><span class="key key--mil" aria-hidden="true" />{{ t('control.legendMilitary') }}</li>
      <li><span class="key key--other" aria-hidden="true" />{{ t('control.legendOther') }}</li>
      <li><span class="key key--site" aria-hidden="true" />{{ t('control.legendSite') }}</li>
      <li><span class="key key--track" aria-hidden="true" />{{ t('control.legendTrack') }}</li>
      <li><span class="key key--night" aria-hidden="true" />{{ t('control.legendNight') }}</li>
    </ul>
  </div>
</template>

<style scoped>
.map {
  position: relative;
  flex: 1;
  min-height: 22rem;
  overflow: hidden;
  background: var(--paper);
  background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 4rem 4rem;
}
.map__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
}
.map__canvas:active {
  cursor: grabbing;
}
.map__marker {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  will-change: transform;
}
.map__core {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 10px;
  height: 10px;
  background: var(--signal);
  border: 2px solid var(--ink);
  border-radius: 50%;
}
.map__pulse {
  position: absolute;
  top: -24px;
  left: -24px;
  width: 48px;
  height: 48px;
  border: 1px solid var(--signal);
  border-radius: 50%;
  animation: pulse 2.4s var(--ease-out) infinite;
}
.map__pulse--late {
  animation-delay: 1.2s;
}
[data-motion='off'] .map__pulse {
  display: none;
}
@keyframes pulse {
  from {
    transform: scale(0.15);
    opacity: 1;
  }
  to {
    transform: scale(1.2);
    opacity: 0;
  }
}
.map__callout {
  position: absolute;
  top: -2rem;
  left: 0.875rem;
  padding: 0.0625rem 0.375rem;
  background: var(--signal);
  color: var(--on-signal);
  font: 600 0.6875rem var(--font-mono);
  white-space: nowrap;
}
.map__tip {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  margin: 0;
  padding: 0.125rem 0.375rem;
  background: var(--ink);
  color: var(--paper);
  font: 500 0.6875rem var(--font-mono);
  white-space: nowrap;
  pointer-events: none;
}
.map__tools {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.map__group {
  display: flex;
  background: var(--paper);
  border: 1px solid var(--line-strong);
}
.map__btn {
  display: inline-grid;
  place-items: center;
  min-width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: 0;
  color: var(--ink);
  cursor: pointer;
}
.map__btn--text {
  padding: 0 0.75rem;
  font: 500 0.8125rem var(--font-sans);
}
.map__btn:hover {
  background: var(--raised);
}
.map__btn[aria-pressed='true'] {
  background: var(--ink);
  color: var(--paper);
}
.map__legend {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin: 0;
  padding: 0.375rem 0.625rem;
  max-width: calc(100% - 1.5rem);
  background: var(--paper);
  border: 1px solid var(--line);
  list-style: none;
  font: 400 0.6875rem var(--font-mono);
}
.map__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.key {
  display: inline-block;
  width: 8px;
  height: 8px;
}
.key--tracked {
  background: var(--signal);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--ink);
}
.key--mil {
  background: var(--alert);
  transform: rotate(45deg);
}
.key--other {
  background: var(--ink);
  border-radius: 50%;
  width: 5px;
  height: 5px;
}
.key--site {
  border: 1.5px solid var(--ink);
}
.key--night {
  background: var(--night);
  box-shadow: inset 0 0 0 1px var(--line-strong);
}
.key--track {
  width: 14px;
  height: 0;
  border-top: 2px dashed var(--signal);
}
</style>
