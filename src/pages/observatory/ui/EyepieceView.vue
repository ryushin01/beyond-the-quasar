<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { EclipseId, EyepieceDisk, EyepieceScene } from '@/entities/sky'

const props = withDefaults(defineProps<{ id: EclipseId; scene: EyepieceScene; fov?: number }>(), { fov: 1.6 })

const { t } = useI18n()
const TICK_STEP = 0.1

/** 도 단위를 시야 반지름이 1인 좌표로 바꿉니다. 화면 아래로 갈수록 y가 커지므로 뒤집습니다. */
const scale = computed(() => 2 / props.fov)
const place = (disk: EyepieceDisk) => ({ cx: disk.x * scale.value, cy: -disk.y * scale.value, r: disk.radius * scale.value })

const tracked = computed(() => place(props.scene.tracked))
const occluder = computed(() => (props.scene.occluder ? place(props.scene.occluder) : null))
const umbra = computed(() => (props.scene.umbra ? place(props.scene.umbra) : null))
const penumbra = computed(() => (props.scene.penumbra ? place(props.scene.penumbra) : null))
const belowHorizon = computed(() => props.scene.altitude < 0)
const ticks = computed(() => {
  const count = Math.floor(props.fov / 2 / TICK_STEP)
  return Array.from({ length: count * 2 + 1 }, (_, index) => (index - count) * TICK_STEP * scale.value).filter((value) => Math.abs(value) > 0.01)
})
const label = computed(() => t(props.id === 'solarEclipse' ? 'observatory.eclipse.eyepieceSolar' : 'observatory.eclipse.eyepieceLunar'))
</script>

<template>
  <figure class="eyepiece">
    <svg class="eyepiece__view" viewBox="-1.08 -1.08 2.16 2.16" role="img" :aria-label="label">
      <defs>
        <radialGradient id="eyepiece-sun">
          <stop offset="0" stop-color="#fffdf6" />
          <stop offset="0.7" stop-color="#fff1c8" />
          <stop offset="1" stop-color="#f3b862" />
        </radialGradient>
        <radialGradient id="eyepiece-glow">
          <stop offset="0.4" stop-color="rgb(255 236 190 / 0.5)" />
          <stop offset="1" stop-color="rgb(255 236 190 / 0)" />
        </radialGradient>
        <radialGradient id="eyepiece-moon" cx="0.42" cy="0.38">
          <stop offset="0" stop-color="#e9e6df" />
          <stop offset="1" stop-color="#8e8a82" />
        </radialGradient>
        <clipPath id="eyepiece-field"><circle r="1" /></clipPath>
        <clipPath id="eyepiece-moon-clip"><circle :cx="tracked.cx" :cy="tracked.cy" :r="tracked.r" /></clipPath>
      </defs>

      <circle r="1" fill="#000" />
      <g clip-path="url(#eyepiece-field)">
        <template v-if="id === 'solarEclipse'">
          <circle :cx="tracked.cx" :cy="tracked.cy" :r="tracked.r * 1.9" fill="url(#eyepiece-glow)" />
          <circle :cx="tracked.cx" :cy="tracked.cy" :r="tracked.r" fill="url(#eyepiece-sun)" />
          <circle v-if="occluder" :cx="occluder.cx" :cy="occluder.cy" :r="occluder.r" fill="#030303" />
        </template>
        <template v-else>
          <circle :cx="tracked.cx" :cy="tracked.cy" :r="tracked.r" fill="url(#eyepiece-moon)" />
          <g clip-path="url(#eyepiece-moon-clip)">
            <circle v-if="penumbra" :cx="penumbra.cx" :cy="penumbra.cy" :r="penumbra.r" fill="rgb(0 0 0 / 0.38)" />
            <circle v-if="umbra" :cx="umbra.cx" :cy="umbra.cy" :r="umbra.r" fill="rgb(92 24 10 / 0.88)" />
          </g>
          <circle v-if="umbra" :cx="umbra.cx" :cy="umbra.cy" :r="umbra.r" class="eyepiece__shadow-edge" />
          <circle v-if="penumbra" :cx="penumbra.cx" :cy="penumbra.cy" :r="penumbra.r" class="eyepiece__shadow-edge eyepiece__shadow-edge--soft" />
        </template>

        <g class="eyepiece__reticle">
          <line x1="-1" x2="-0.12" y1="0" y2="0" />
          <line x1="0.12" x2="1" y1="0" y2="0" />
          <line y1="-1" y2="-0.12" x1="0" x2="0" />
          <line y1="0.12" y2="1" x1="0" x2="0" />
          <line v-for="tick in ticks" :key="`x${tick}`" :x1="tick" :x2="tick" y1="-0.025" y2="0.025" />
          <line v-for="tick in ticks" :key="`y${tick}`" :y1="tick" :y2="tick" x1="-0.025" x2="0.025" />
        </g>
        <rect v-if="belowHorizon" x="-1" y="-1" width="2" height="2" fill="rgb(0 0 0 / 0.72)" />
      </g>

      <circle r="1" class="eyepiece__rim" />
      <circle r="1.04" class="eyepiece__rim eyepiece__rim--outer" />
      <text y="-0.9" class="eyepiece__mark">N</text>
      <text x="-0.9" y="0.02" class="eyepiece__mark">E</text>
      <text v-if="belowHorizon" y="0.02" class="eyepiece__notice">{{ t('observatory.eclipse.belowHorizon') }}</text>
    </svg>
    <figcaption class="eyepiece__caption">
      <span>{{ t('observatory.eclipse.fov', { n: fov.toFixed(1) }) }}</span>
      <span>{{ t('observatory.eclipse.altitude') }} {{ scene.altitude.toFixed(1) }}°</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.eyepiece {
  margin: 0;
}
.eyepiece__view {
  display: block;
  width: 100%;
  max-width: 26rem;
  margin-inline: auto;
}
.eyepiece__reticle line {
  stroke: rgb(255 80 60 / 0.75);
  stroke-width: 0.006;
}
.eyepiece__shadow-edge {
  fill: none;
  stroke: rgb(255 120 90 / 0.5);
  stroke-width: 0.006;
  stroke-dasharray: 0.02 0.02;
}
.eyepiece__shadow-edge--soft {
  stroke: rgb(255 255 255 / 0.25);
}
.eyepiece__rim {
  fill: none;
  stroke: #2a2a30;
  stroke-width: 0.02;
}
.eyepiece__rim--outer {
  stroke: #111114;
  stroke-width: 0.06;
}
.eyepiece__mark {
  fill: rgb(255 80 60 / 0.85);
  font: 600 0.06px var(--font-mono);
  text-anchor: middle;
}
.eyepiece__notice {
  fill: #fff;
  font: 600 0.08px var(--font-sans);
  text-anchor: middle;
}
.eyepiece__caption {
  display: flex;
  justify-content: space-between;
  max-width: 26rem;
  margin: 0.75rem auto 0;
  color: var(--muted);
  font: 500 0.75rem var(--font-mono);
}
</style>
