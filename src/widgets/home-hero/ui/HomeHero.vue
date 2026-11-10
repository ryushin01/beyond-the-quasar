<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { EASE, gsap, introDone, useMotionPreference } from '@/shared/motion'
import { QuasarField } from '@/widgets/quasar-field'

const { t } = useI18n()
const { enabled } = useMotionPreference()

const root = ref<HTMLElement>()
const progress = ref(0)
const LINES = ['Beyond', 'The', 'Quasar']
let context: gsap.Context | undefined
let introPlayed = false

function playIntro(): void {
  if (introPlayed || !context) return
  introPlayed = true
  context.add(() => {
    gsap
      .timeline()
      .to('.hero__char', { yPercent: 0, duration: 1.1, ease: EASE.out, stagger: { each: 0.028 } })
      .from('.hero__meta > *', { autoAlpha: 0, y: 16, duration: 0.8, ease: EASE.soft, stagger: 0.08 }, 0.55)
  })
}

function build(): void {
  context?.revert()
  introPlayed = false
  context = gsap.context(() => {}, root.value)
  if (!enabled.value) {
    progress.value = 0
    return
  }
  context.add(() => {
    gsap.set('.hero__char', { yPercent: 115 })
    gsap.timeline({
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => (progress.value = self.progress),
      },
    })
      .to('.hero__line--a', { xPercent: -14, ease: 'none' }, 0)
      .to('.hero__line--b', { xPercent: 30, ease: 'none' }, 0)
      .to('.hero__line--c', { xPercent: 12, ease: 'none' }, 0)
      .to('.hero__title', { yPercent: -24, ease: 'none' }, 0)
      .to('.hero__meta', { autoAlpha: 0, ease: 'none', duration: 0.4 }, 0)
  })
  if (introDone.value) playIntro()
}

onMounted(() => {
  watch(enabled, build, { immediate: true })
})
watch(introDone, (done) => {
  if (done && enabled.value) playIntro()
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section ref="root" class="hero scope-dark">
    <QuasarField :progress="progress" />
    <h1 class="hero__title display">
      <span class="sr-only">{{ LINES.join(' ') }}</span>
      <span v-for="(line, index) in LINES" :key="line" aria-hidden="true" class="hero__line" :class="`hero__line--${'abc'[index]}`">
        <span v-for="(char, charIndex) in line" :key="charIndex" class="hero__char">{{ char }}</span>
      </span>
    </h1>
    <div class="hero__meta">
      <p class="hero__tagline">{{ t('home.tagline') }}</p>
      <p class="hero__target">{{ t('home.heroMeta') }}</p>
      <a href="#stop-sky" class="hero__scroll">
        <span>{{ t('home.scroll') }}</span>
        <span class="hero__scroll-bar" aria-hidden="true" />
      </a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100svh - var(--chrome-height));
  padding: var(--margin);
  overflow: hidden;
  background: #000;
  color: #fff;
}
.hero__title {
  position: relative;
  margin: 0;
  font-size: clamp(3rem, min(16.2vw, 22svh), 17rem);
  color: #fff;
  will-change: transform;
}
.hero__line {
  display: block;
  overflow: hidden;
  padding-block: 0.02em;
  width: fit-content;
  will-change: transform;
}
.hero__line--b {
  margin-left: 16vw;
  font-stretch: 62%;
  font-weight: 300;
  letter-spacing: 0;
}
.hero__char {
  display: inline-block;
}
.hero__meta {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: end;
  gap: 1rem var(--gutter);
  padding-top: 2rem;
}
.hero__tagline {
  grid-column: span 5;
  margin: 0;
  font-size: clamp(1.125rem, 1.7vw, 1.625rem);
  font-weight: 600;
  line-height: 1.3;
}
.hero__target {
  grid-column: 7 / span 4;
  margin: 0;
  font: 400 0.8125rem/1.5 var(--font-mono);
  color: #cfcfcf;
}
.hero__scroll {
  grid-column: 11 / span 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-height: 2.75rem;
  color: #fff;
  font: 500 0.8125rem var(--font-mono);
  text-decoration: none;
  text-align: right;
}
.hero__scroll-bar {
  position: relative;
  width: 1px;
  height: 3rem;
  overflow: hidden;
  background: rgb(255 255 255 / 0.3);
}
.hero__scroll-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #fff;
  animation: drip 1.8s var(--ease-out) infinite;
}
@keyframes drip {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(100%);
  }
}
[data-motion='off'] .hero__scroll-bar::after {
  animation: none;
}
@media (max-width: 720px) {
  .hero__tagline,
  .hero__target {
    grid-column: 1 / -1;
  }
  .hero__scroll {
    grid-column: 1 / -1;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
