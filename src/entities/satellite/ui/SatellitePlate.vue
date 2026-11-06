<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatNumber } from '@/shared/lib'
import { gsap, useMotionPreference } from '@/shared/motion'

import type { Satellite } from '../model/types'
import SatelliteTags from './SatelliteTags.vue'

const props = defineProps<{ satellite: Satellite }>()
defineEmits<{ open: [] }>()

const { t } = useI18n()
const { enabled } = useMotionPreference()
const face = ref<HTMLElement>()

const altitude = computed(() => {
  const { apogeeKm, perigeeKm } = props.satellite
  return apogeeKm !== null && perigeeKm !== null ? (apogeeKm + perigeeKm) / 2 : null
})

function onMove(event: PointerEvent): void {
  if (!enabled.value || event.pointerType !== 'mouse' || !face.value) return
  const box = face.value.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width - 0.5
  const y = (event.clientY - box.top) / box.height - 0.5
  gsap.to(face.value, { rotateY: x * 14, rotateX: -y * 14, duration: 0.5, ease: 'power3.out' })
  face.value.style.setProperty('--sheen-x', `${(x + 0.5) * 100}%`)
  face.value.style.setProperty('--sheen-y', `${(y + 0.5) * 100}%`)
}

function onLeave(): void {
  if (face.value) gsap.to(face.value, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'expo.out' })
}
</script>

<template>
  <article class="plate-wrap" @pointermove="onMove" @pointerleave="onLeave">
    <div ref="face" class="plate" :class="`plate--${satellite.category}`">
      <div class="plate__sheen" aria-hidden="true" />
      <p class="plate__top">
        <span class="plate__code">{{ t(`categoryCodes.${satellite.category}`) }}</span>
        <span class="plate__id">#{{ satellite.noradId }}</span>
      </p>
      <p class="plate__mission" aria-hidden="true">{{ t(`missionCodes.${satellite.mission}`) }}</p>
      <div class="plate__bottom">
        <h3 class="plate__name">
          <button type="button" class="plate__button" :aria-label="t('catalog.open', { name: satellite.name })" @click="$emit('open')">
            {{ satellite.name }}
          </button>
        </h3>
        <p class="plate__desc">{{ t(`missions.${satellite.mission}`) }}</p>
        <p class="plate__alt">{{ formatNumber(altitude) }} km</p>
        <SatelliteTags :satellite="satellite" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.plate-wrap {
  perspective: 900px;
}
.plate {
  --plate-bg: var(--raised);
  --plate-ink: var(--ink);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  aspect-ratio: 5 / 7.4;
  min-height: 22rem;
  width: 100%;
  padding: 1rem;
  overflow: hidden;
  background: var(--plate-bg);
  color: var(--plate-ink);
  border: 1px solid var(--line-strong);
  border-radius: 0.875rem;
  transform-style: preserve-3d;
  container-type: inline-size;
  transition: border-color 0.2s ease;
}
.plate:hover,
.plate:focus-within {
  border-color: var(--ink);
}
.plate:has(.plate__button:focus-visible) {
  outline: 3px solid var(--signal);
  outline-offset: 3px;
}
.plate--military {
  background-image: repeating-linear-gradient(135deg, transparent 0 18px, color-mix(in srgb, var(--alert) 9%, transparent) 18px 20px);
}
.plate__sheen {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(circle at var(--sheen-x, 50%) var(--sheen-y, 50%), color-mix(in srgb, var(--signal) 35%, transparent), transparent 55%);
  transition: opacity 0.25s ease;
  pointer-events: none;
}
.plate:hover .plate__sheen {
  opacity: 1;
}
.plate__top {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin: 0;
  font: 500 0.75rem var(--font-mono);
}
.plate--military .plate__code {
  color: var(--alert);
}
.plate__mission {
  position: relative;
  margin: 0;
  font: 800 17cqi / 1 var(--font-display);
  font-stretch: 112%;
  letter-spacing: -0.02em;
  white-space: nowrap;
  transition: font-stretch 0.4s var(--ease-out);
}
.plate:hover .plate__mission {
  font-stretch: 62%;
}
.plate__bottom {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.plate__name {
  margin: 0;
  font: 700 1rem/1.25 var(--font-sans);
  letter-spacing: 0;
}
.plate__button {
  all: unset;
  cursor: pointer;
}
/* 카드 전체를 누를 수 있게 합니다 */
.plate__button::after {
  content: '';
  position: absolute;
  inset: -100vh;
}
.plate__desc {
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.35;
}
.plate__alt {
  margin: 0 0 0.25rem;
  font: 500 0.75rem var(--font-mono);
}
</style>
