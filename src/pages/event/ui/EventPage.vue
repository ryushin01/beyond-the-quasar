<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { onBeforeUnmount, ref } from 'vue'

import { EASE, gsap, introDone, useGsapContext, useMotionPreference, useSmoothScroll } from '@/shared/motion'

import { CHAPTERS, sectionId } from '../lib/chapters'
import { readScene, type SceneState } from '../lib/scene'
import CalendarChapter from './CalendarChapter.vue'
import EventHud from './EventHud.vue'
import EventRail from './EventRail.vue'
import EventStage from './EventStage.vue'
import HorizonChapter from './HorizonChapter.vue'
import ReturnChapter from './ReturnChapter.vue'
import SignalChapter from './SignalChapter.vue'

useSmoothScroll()
const { enabled } = useMotionPreference()

const root = ref<HTMLElement>()
const scene = ref<SceneState>({ mix: 0, fall: 0, dim: 0, active: 0 })
let frame = 0

function measure(): void {
  frame = 0
  const tops = CHAPTERS.map((chapter) => document.getElementById(sectionId(chapter))?.getBoundingClientRect().top ?? 0)
  scene.value = readScene({ tops, viewport: window.innerHeight, motion: enabled.value })
}

function schedule(): void {
  if (!frame) frame = requestAnimationFrame(measure)
}

// 인트로가 끝난 뒤에 다시 만들고, 모션과 상관없이 장면 값을 한 번 잽니다.
useGsapContext(
  root,
  () => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.from(element, {
        y: 36,
        autoAlpha: 0,
        duration: 1.1,
        ease: EASE.out,
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      })
    })
  },
  { watch: [introDone], before: schedule },
)

useEventListener(window, 'scroll', schedule, { passive: true })
useEventListener(window, 'resize', schedule, { passive: true })

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <div ref="root" class="event scope-dark">
    <div class="event__sticky">
      <EventStage :mix="scene.mix" :fall="scene.fall" :dim="scene.dim" />
    </div>
    <EventHud :active="scene.active" />
    <EventRail :active="scene.active" />

    <SignalChapter />
    <CalendarChapter />
    <HorizonChapter />
    <ReturnChapter />
  </div>
</template>

<style scoped>
.event {
  --cut: 1.125rem;
  --hud-text: #e2e2e2;
  --hud-dim: #6b6b6b;
  --hud-body: #9c9c9c;
  --hud-line: rgb(191 191 191 / 0.3);
  --frame-inset: 1rem;
  position: relative;
  /* 반투명 헤더 뒤로 장면이 이어지도록 본문 여백을 되돌립니다 */
  margin-top: calc(-1 * var(--chrome-height));
  background: #00030c;
  color: var(--hud-text);
}
.event__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  margin-bottom: -100svh;
  overflow: hidden;
}
/* 구역별 어두운 막에 묻히지 않도록 테두리와 아래 띠는 본문 위에 둡니다 */
.event__sticky--hud {
  z-index: 3;
  pointer-events: none;
}

/*
 * 장(章) 컴포넌트의 바깥 요소(section)에는 이 화면의 범위 지정 스타일도 함께 적용됩니다.
 * 여러 장이 함께 쓰는 여백 설정의 우선순위가 바뀌지 않도록 장의 배치는 여기 한곳에 둡니다.
 */
.chapter {
  position: relative;
  z-index: 2;
  display: grid;
  min-height: 100svh;
  padding: calc(var(--chrome-height) + 2.5rem) clamp(1.75rem, 12vw, 11rem) 6rem;
}
.chapter:focus {
  outline: none;
}
.chapter--signal {
  /* 글자 뒤 어둠 막이 좁은 화면에서 가로로 넘치지 않게 합니다. 고정 배치에 영향이 없는 clip을 씁니다 */
  overflow: clip;
  align-items: end;
  justify-items: center;
  text-align: center;
}
.chapter--calendar {
  align-items: center;
}
.chapter--horizon {
  align-items: end;
}
.chapter--return {
  align-items: center;
  justify-items: center;
  text-align: center;
  background: linear-gradient(to bottom, transparent, #000 80%);
}

/* 여러 장이 함께 쓰는 글자·링크 모양 */
.event :deep(.eyebrow) {
  margin: 0 0 0.75rem;
  color: var(--hud-text);
  font: 500 0.75rem/1.5 var(--font-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.event :deep(.horizon__title span) {
  display: block;
}
.event :deep(.horizon__title) {
  margin: 0;
  color: #fff;
  font: 200 clamp(2.125rem, 5.4vw, 4.75rem) / 1.14 var(--font-display);
  font-stretch: 118%;
  letter-spacing: 0.06em;
}
/* 깎인 모서리는 장식 층에만 적용해 초점 표시가 잘리지 않게 합니다 */
.event :deep(.cut-link) {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 3rem;
  padding: 0 1.5rem;
  color: #fff;
  font: 600 0.8125rem var(--font-mono);
  text-decoration: none;
  text-transform: uppercase;
}
.event :deep(.cut-link::before),
.event :deep(.cut-link::after) {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: polygon(0.75rem 0, 100% 0, 100% calc(100% - 0.75rem), calc(100% - 0.75rem) 100%, 0 100%, 0 0.75rem);
  transition: background-color 0.25s ease;
}
.event :deep(.cut-link::before) {
  inset: 0;
  background: var(--hud-line);
}
.event :deep(.cut-link::after) {
  inset: 1px;
  background: #06102f;
}
.event :deep(.cut-link:hover::after) {
  background: #1a3fe0;
}
.event :deep(.cut-link__mark) {
  width: 0.4375rem;
  height: 0.4375rem;
  background: var(--signal-text);
}

@media (max-width: 1000px) {
  /* 세로로 쌓이면 글이 블랙홀을 덮지 않도록 첫 화면 위쪽을 비웁니다 */
  .chapter--horizon {
    padding-top: 48svh;
  }
}
@media (max-width: 899px) {
  .chapter {
    padding-inline: 1.75rem;
  }
}
</style>
