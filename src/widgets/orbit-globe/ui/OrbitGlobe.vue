<script setup lang="ts">
import { symSharpAdd, symSharpChevronLeft, symSharpChevronRight, symSharpRemove } from '@quasar/extras/material-symbols-sharp'
import { useElementSize, useIntervalFn, useMutationObserver } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ORBITS, countBy, earthRotation, orbitPath, scenePosition, toSatrec, type Satellite } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'
import { useMotionPreference } from '@/shared/motion/preference'

import type { GlobeColors, GlobeOrbit, GlobeScene } from '../lib/scene'

const props = defineProps<{ satellites: Satellite[] }>()

const { t } = useI18n()
const store = useSatelliteFilter()
const { enabled: motion } = useMotionPreference()

const frame = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const { width, height } = useElementSize(frame)
const scene = shallowRef<GlobeScene>()
const unsupported = ref(false)
const now = ref(new Date())

const shown = computed(() => store.apply(props.satellites))

const orbitCounts = computed(() => countBy(shown.value, (satellite) => satellite.orbit))
const militaryCount = computed(() => shown.value.filter((satellite) => satellite.category === 'military').length)
const summary = computed(() =>
  t('orbitGlobe.summary', {
    n: shown.value.length,
    mil: militaryCount.value,
    list: ORBITS.map((orbit) => `${orbit} ${orbitCounts.value.get(orbit) ?? 0}`).join(', '),
  }),
)

function readColors(): GlobeColors {
  const style = getComputedStyle(frame.value ?? document.documentElement)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    line: read('--line-strong', '#888'),
    lineStrong: read('--ink', '#fff'),
    paper: read('--paper', '#000'),
    signal: read('--signal-text', '#8aa8ff'),
    alert: read('--alert', '#ffb224'),
  }
}

// 궤도 고리는 필터가 바뀔 때만 다시 계산하고, 위성 위치는 시계에 맞춰 옮깁니다.
const paths = computed(() =>
  new Map(shown.value.map((satellite) => [satellite.noradId, orbitPath(toSatrec(satellite.line1, satellite.line2), now.value)])),
)
watch(
  () => shown.value.map((satellite) => satellite.noradId).join(),
  () => {
    now.value = new Date()
  },
)

function orbits(): GlobeOrbit[] {
  return shown.value.map((satellite) => ({
    id: satellite.noradId,
    path: paths.value.get(satellite.noradId) ?? [],
    military: satellite.category === 'military',
  }))
}

// 매 초에는 위성 위치와 지구 자전만 바꾸고, 궤도선은 다시 만들지 않습니다.
function move(date = new Date()): void {
  if (!scene.value) return
  scene.value.setPositions(
    new Map(shown.value.map((satellite) => [satellite.noradId, scenePosition(toSatrec(satellite.line1, satellite.line2), date)])),
  )
  scene.value.setEarthRotation(earthRotation(date))
}

function draw(): void {
  if (!scene.value) return
  scene.value.setOrbits(orbits())
  move()
}

// 동작 줄이기나 모션 정지 중에는 위성 위치를 움직이지 않습니다(KWCAG 6.2.2).
const ticker = useIntervalFn(() => move(), 1000, { immediate: false })
watch(
  [motion, scene],
  ([on, ready]) => {
    ready?.setAutoRotate(on)
    if (on && ready) ticker.resume()
    else ticker.pause()
  },
  { immediate: true },
)
watch([paths, scene], () => draw())
watch([width, height, scene], ([w, h, ready]) => ready?.resize(w, h))

// 밝은·어두운 화면을 바꾸면 선 색도 따라 바꿉니다.
useMutationObserver(
  document.documentElement,
  () => scene.value?.setColors(readColors()),
  { attributes: true, attributeFilter: ['data-theme'] },
)

// three.js를 받는 사이 화면을 떠나면, 받은 뒤에 장면을 만들지 않습니다.
let unmounted = false
onMounted(async () => {
  if (!canvas.value) return
  try {
    // three.js는 이 보기를 열 때만 내려받습니다.
    const { createGlobeScene } = await import('../lib/scene')
    if (unmounted || !canvas.value) return
    scene.value = createGlobeScene(canvas.value, readColors())
  } catch {
    // WebGL을 쓸 수 없는 브라우저는 글 요약과 궤도 분포도로 같은 정보를 봅니다.
    unsupported.value = true
  }
})
onBeforeUnmount(() => {
  unmounted = true
  scene.value?.dispose()
})
</script>

<template>
  <figure class="globe">
    <figcaption class="sr-only">{{ summary }}</figcaption>
    <div ref="frame" class="globe__frame">
      <canvas v-show="!unsupported" ref="canvas" class="globe__canvas" role="img" :aria-label="summary" />
      <p v-if="unsupported" class="globe__fallback">{{ t('orbitGlobe.unsupported') }}</p>
      <div class="globe__tools" role="group" :aria-label="t('orbitGlobe.tools')">
        <button type="button" class="globe__btn" :aria-label="t('orbitGlobe.rotateLeft')" :disabled="!scene" @click="scene?.rotate(-Math.PI / 8)">
          <q-icon :name="symSharpChevronLeft" size="1.125rem" />
        </button>
        <button type="button" class="globe__btn" :aria-label="t('orbitGlobe.rotateRight')" :disabled="!scene" @click="scene?.rotate(Math.PI / 8)">
          <q-icon :name="symSharpChevronRight" size="1.125rem" />
        </button>
        <button type="button" class="globe__btn" :aria-label="t('orbitGlobe.zoomIn')" :disabled="!scene" @click="scene?.zoom(1 / 1.3)">
          <q-icon :name="symSharpAdd" size="1.125rem" />
        </button>
        <button type="button" class="globe__btn" :aria-label="t('orbitGlobe.zoomOut')" :disabled="!scene" @click="scene?.zoom(1.3)">
          <q-icon :name="symSharpRemove" size="1.125rem" />
        </button>
      </div>
    </div>
    <div class="globe__legend">
      <span><i class="globe__key globe__key--mil" aria-hidden="true" />{{ t('control.legendMilitary') }}</span>
      <span><i class="globe__key" aria-hidden="true" />{{ t('control.legendOther') }}</span>
      <span class="globe__hint">{{ t('orbitGlobe.hint') }}</span>
    </div>
  </figure>
</template>

<style scoped>
.globe {
  margin: 0;
}
.globe__frame {
  position: relative;
  height: clamp(22rem, 62vh, 36rem);
  border: 1px solid var(--line);
}
.globe__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}
.globe__canvas:active {
  cursor: grabbing;
}
.globe__fallback {
  display: grid;
  place-items: center;
  height: 100%;
  margin: 0;
  padding: 1rem;
  color: var(--muted);
  text-align: center;
}
.globe__tools {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  border: 1px solid var(--line-strong);
  background: var(--paper);
}
.globe__btn {
  display: inline-grid;
  place-items: center;
  min-width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: 0;
  color: var(--ink);
  cursor: pointer;
}
.globe__btn:hover:not(:disabled) {
  background: var(--raised);
}
.globe__btn:disabled {
  color: var(--muted);
  cursor: default;
}
.globe__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}
.globe__legend > span {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.globe__key {
  display: inline-block;
  width: 0.625rem;
  height: 0.625rem;
  background: var(--signal-text);
  border-radius: 50%;
}
.globe__key--mil {
  background: var(--alert);
  border-radius: 0;
  transform: rotate(45deg);
}
.globe__hint {
  color: var(--muted);
}
</style>
