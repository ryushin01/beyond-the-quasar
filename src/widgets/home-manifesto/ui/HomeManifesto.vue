<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { gsap, ScrollTrigger, useMotionPreference } from '@/shared/motion'

const { t, locale } = useI18n()
const { enabled } = useMotionPreference()

const root = ref<HTMLElement>()
const words = computed(() => t('home.manifesto').split(' '))
let context: gsap.Context | undefined

function build(): void {
  context?.revert()
  context = undefined
  if (!enabled.value) return
  context = gsap.context(() => {
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: root.value, start: 'top top', end: '+=220%', pin: true, scrub: 0.4 },
    })
    timeline
      .fromTo('.manifesto__word', { opacity: 0.16 }, { opacity: 1, stagger: 0.1, duration: 0.5, ease: 'none' })
      .to({}, { duration: 0.6 })
      // 파란 점이 커져 다음 구역의 바탕이 됩니다.
      .fromTo('.manifesto__dot', { scale: 0 }, { scale: 1, duration: 2.4, ease: 'expo.in' })
  }, root.value)
  ScrollTrigger.refresh()
}

onMounted(() => {
  watch([enabled, locale], build, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section id="manifesto" ref="root" class="manifesto">
    <p class="manifesto__text">
      <template v-for="(word, index) in words" :key="index"><span class="manifesto__word">{{ word }}</span>{{ ' ' }}</template>
    </p>
    <span class="manifesto__dot" aria-hidden="true" />
  </section>
</template>

<style scoped>
.manifesto {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100svh;
  padding: 6rem var(--margin);
  overflow: hidden;
  background: var(--paper);
}
.manifesto__text {
  position: relative;
  max-width: 62rem;
  margin: 0;
  font-size: clamp(1.75rem, 4.4vw, 4.5rem);
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.02em;
}
.manifesto__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300vmax;
  height: 300vmax;
  margin: -150vmax 0 0 -150vmax;
  border-radius: 50%;
  background: #1a3fe0;
  transform: scale(0);
  pointer-events: none;
}
[data-motion='off'] .manifesto__dot {
  display: none;
}
</style>
