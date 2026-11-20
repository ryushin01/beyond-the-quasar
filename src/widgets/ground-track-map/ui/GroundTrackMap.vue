<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { zoomIdentity, type ZoomTransform } from 'd3-zoom'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { useObserver } from '@/entities/observer'
import { stateAt, toSatrec, type Satellite } from '@/entities/satellite'
import { subsolarPoint } from '@/entities/sky'
import { formatLatitude, formatLongitude, formatNumber } from '@/shared/lib'
import { gsap, useMotionPreference } from '@/shared/motion'

import { paintMap, readPalette, type PlacedSatellite } from '../lib/paint'
import { buildProjection, dragRotation, nearestPoint, rotationToward, type MapMode, type MapTransform } from '../lib/projection'
import { createTrackGeometry } from '../lib/track'
import { attachMapZoom, type MapZoom } from '../lib/zoom'
import MapLegend from './MapLegend.vue'
import MapTools from './MapTools.vue'

const props = defineProps<{ satellites: Satellite[]; tracked: Satellite | null }>()
const emit = defineEmits<{ select: [noradId: number] }>()

const { t } = useI18n()
const clock = useMissionClock()
const observer = useObserver()
const { enabled } = useMotionPreference()

const canvas = ref<HTMLCanvasElement>()
const marker = ref<HTMLElement>()
const mode = ref<MapMode>('flat')
const size = shallowRef({ width: 0, height: 0 })
const hovered = ref<{ name: string; x: number; y: number } | null>(null)

const rotation = { lambda: -127, phi: -20 }
const trackGeometry = createTrackGeometry()
let transform: MapTransform = zoomIdentity
let lastTransform: MapTransform = zoomIdentity
let zoom: MapZoom | null = null
let userMovedGlobe = false
let globeTurning = false
let positions: PlacedSatellite[] = []

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

  const state = trackedState.value
  const result = paintMap(context, {
    projection: buildProjection(mode.value, size.value, transform, rotation),
    mode: mode.value,
    palette: readPalette(element),
    now: clock.now,
    sun: subsolarPoint(clock.now),
    satellites: props.satellites,
    trackedId: props.tracked?.noradId,
    track: props.tracked && state ? { ...trackGeometry.at(props.tracked, clock.now), state } : null,
    site: observer.site,
  })
  positions = result.positions

  // 추적 위성은 CSS로 깜빡이는 DOM 표식으로 올립니다.
  if (marker.value) {
    const point = result.trackedPoint
    marker.value.style.display = point ? 'block' : 'none'
    if (point) marker.value.style.transform = `translate(${point[0]}px, ${point[1]}px)`
  }
}

/** 지구본이 추적 위성을 향해 돌아갑니다. */
function followTracked(animated: boolean): void {
  if (mode.value !== 'globe' || !trackedState.value) return
  globeTurning = false
  const target = rotationToward(rotation, trackedState.value.longitude, trackedState.value.latitude)
  gsap.killTweensOf(rotation)
  if (animated && enabled.value) {
    globeTurning = true
    gsap.to(rotation, {
      ...target,
      duration: 1.1,
      ease: 'expo.out',
      onUpdate: draw,
      onComplete: () => (globeTurning = false),
    })
  } else {
    Object.assign(rotation, target)
    draw()
  }
}

function onZoom(next: ZoomTransform, fromUser: boolean): void {
  if (mode.value === 'globe') {
    Object.assign(rotation, dragRotation(rotation, next.x - lastTransform.x, next.y - lastTransform.y, next.k))
    if (fromUser) {
      userMovedGlobe = true
      // 사용자가 잡으면 진행 중인 회전 연출을 멈춥니다.
      gsap.killTweensOf(rotation)
      globeTurning = false
    }
  }
  lastTransform = next
  transform = next
  draw()
}

function zoomBy(factor: number): void {
  zoom?.zoomBy(factor)
}

function setMode(next: MapMode): void {
  if (mode.value === next) return
  mode.value = next
  userMovedGlobe = false
  zoom?.reset()
  followTracked(false)
  draw()
}

function nearest(event: MouseEvent): PlacedSatellite | null {
  const box = canvas.value?.getBoundingClientRect()
  if (!box) return null
  return nearestPoint(positions, event.clientX - box.left, event.clientY - box.top)
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
  if (canvas.value) zoom = attachMapZoom(canvas.value, onZoom)
  draw()
})

watch(
  () => clock.now,
  () => {
    if (globeTurning) return
    // 궤도 계산에 실패한 순간에도 지도는 계속 다시 그립니다.
    if (mode.value === 'globe' && !userMovedGlobe && trackedState.value) followTracked(false)
    else draw()
  },
)
watch(() => props.tracked?.noradId, () => {
  trackGeometry.clear()
  userMovedGlobe = false
  followTracked(true)
  draw()
})
watch(() => [props.satellites, observer.siteId], draw)
</script>

<template>
  <div class="map">
    <!-- 지도 위 위성 고르기는 마우스 지름길이다. 키보드로는 위성 목록에서 같은 조작을 한다(docs/development.md, 6.1.1). -->
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/mouse-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
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

    <MapTools :mode="mode" @mode="setMode" @zoom="zoomBy" />
    <MapLegend />
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
</style>
