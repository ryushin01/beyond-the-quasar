<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { gsap, useMotionPreference } from '@/shared/motion'

import { wireframeFormOf, wireframePath, wireframeSegments } from '../lib/wireframe'
import type { Satellite } from '../model/types'

const props = defineProps<{ satellite: Satellite }>()

const { t } = useI18n()
const { enabled } = useMotionPreference()

const PITCH = 24
const REST_YAW = 35
const yaw = ref(REST_YAW)
const segments = computed(() => wireframeSegments(wireframeFormOf(props.satellite.mission)))
const path = computed(() => wireframePath(segments.value, yaw.value, PITCH))

function spin(_time: number, deltaMs: number): void {
  yaw.value = (yaw.value + deltaMs * 0.012) % 360
}

watch(
  enabled,
  (on) => {
    gsap.ticker.remove(spin)
    if (on) gsap.ticker.add(spin)
    else yaw.value = REST_YAW
  },
  { immediate: true },
)
onBeforeUnmount(() => gsap.ticker.remove(spin))
</script>

<template>
  <figure class="wire" :class="{ 'wire--military': satellite.category === 'military' }">
    <svg class="wire__art" viewBox="-165 -92 330 184" aria-hidden="true" focusable="false">
      <path :d="path" />
    </svg>
    <figcaption class="wire__caption">{{ t('catalog.schematic') }}</figcaption>
  </figure>
</template>

<style scoped>
.wire {
  position: relative;
  margin: 0;
  background-image:
    linear-gradient(var(--line) 1px, transparent 1px),
    linear-gradient(90deg, var(--line) 1px, transparent 1px);
  background-size: 1.5rem 1.5rem;
  border: 1px solid var(--line);
}
.wire__art {
  display: block;
  width: 100%;
  height: clamp(6rem, 18vh, 10rem);
  fill: none;
  stroke: var(--signal-text);
  stroke-width: 1;
}
.wire__art path {
  vector-effect: non-scaling-stroke;
}
.wire--military .wire__art {
  stroke: var(--alert);
}
.wire__caption {
  padding: 0.25rem 0.5rem;
  background: var(--raised);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font: 500 0.6875rem var(--font-mono);
}
</style>
