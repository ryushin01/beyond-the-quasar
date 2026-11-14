<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ROUTES } from '@/shared/config'
import { EASE, gsap, useMotionPreference } from '@/shared/motion'

const { t } = useI18n()
const { enabled } = useMotionPreference()

const WORD = 'QUASAR'
/** 데이터·글꼴의 출처는 화면이 아니라 저장소 README에 적습니다. */
const SOURCES_URL = 'https://github.com/ryushin01/beyond-the-quasar#출처'
const root = ref<HTMLElement>()
const giant = ref<HTMLElement>()
let context: gsap.Context | undefined
let letters: HTMLElement[] = []

/** 포인터에 가까운 글자일수록 넓어지고 굵어져, 글자들이 파도처럼 자리를 내줍니다. */
function onMove(event: PointerEvent): void {
  if (!enabled.value || event.pointerType !== 'mouse') return
  for (const letter of letters) {
    const box = letter.getBoundingClientRect()
    const distance = Math.abs(event.clientX - (box.left + box.width / 2)) / window.innerWidth
    const force = Math.max(0, 1 - distance * 4.2)
    gsap.to(letter, {
      fontStretch: `${70 + force * 55}%`,
      fontWeight: 300 + force * 600,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }
}

function onLeave(): void {
  gsap.to(letters, { fontStretch: '92%', fontWeight: 800, duration: 0.8, ease: EASE.out, overwrite: 'auto' })
}

function build(): void {
  context?.revert()
  context = undefined
  letters = giant.value ? [...giant.value.querySelectorAll<HTMLElement>('.footer__letter')] : []
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.from(letters, {
      yPercent: 105,
      duration: 1.2,
      ease: EASE.out,
      stagger: 0.05,
      scrollTrigger: { trigger: giant.value, start: 'top 95%' },
    })
  }, root.value)
}

onMounted(() => {
  watch(enabled, build, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <footer ref="root" class="footer scope-dark">
    <div class="footer__top">
      <p class="footer__lead">{{ t('home.footerLead') }}</p>
      <RouterLink :to="ROUTES.control" class="footer__cta">{{ t('home.footerCta') }}</RouterLink>
    </div>
    <div ref="giant" class="footer__giant" aria-hidden="true" @pointermove="onMove" @pointerleave="onLeave">
      <span v-for="(letter, index) in WORD" :key="index" class="footer__letter">{{ letter }}</span>
    </div>
    <div class="footer__notes">
      <p><a class="footer__credits" :href="SOURCES_URL">{{ t('home.credits') }}</a></p>
      <p>{{ t('home.disclaimer') }}</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  padding: clamp(3rem, 6vw, 5rem) var(--margin) 1.5rem;
  background: #000;
  color: #fff;
  overflow: hidden;
}
.footer__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.footer__lead {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.footer__cta {
  display: inline-flex;
  align-items: center;
  min-height: 3.25rem;
  padding: 0 1.75rem;
  background: #fff;
  color: #000;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.25s ease, color 0.25s ease, transform 0.5s var(--ease-out);
}
.footer__cta:hover {
  background: #4a78ff;
  color: #000;
  transform: scale(1.05);
}
.footer__giant {
  display: flex;
  justify-content: space-between;
  margin: clamp(2rem, 4vw, 4rem) 0 1.5rem;
  overflow: hidden;
  font: 800 clamp(3rem, 17vw, 20rem) / 0.86 var(--font-display);
  font-stretch: 92%;
  letter-spacing: -0.03em;
  user-select: none;
}
.footer__letter {
  display: inline-block;
}
.footer__notes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: 0.75rem var(--gutter);
  padding-top: 1rem;
  border-top: 1px solid rgb(255 255 255 / 0.25);
  color: #bdbdbd;
  font-size: 0.8125rem;
  line-height: 1.5;
}
.footer__notes p {
  margin: 0;
}
.footer__credits {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
