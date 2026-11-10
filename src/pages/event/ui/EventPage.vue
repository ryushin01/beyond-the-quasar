<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { daysUntil, upcomingSkyEvents, type SkyEvent } from '@/entities/sky'
import { ROUTES } from '@/shared/config'
import { formatUtc } from '@/shared/lib'
import { EASE, gsap, introDone, scrollToElement, useMotionPreference, useSmoothScroll } from '@/shared/motion'

import { readScene, type SceneState } from '../lib/scene'
import EventStage from './EventStage.vue'

const CHAPTERS = ['signal', 'calendar', 'horizon', 'return'] as const
const FACT_COUNT = 3

useSmoothScroll()
const { t } = useI18n()
const { enabled } = useMotionPreference()

const root = ref<HTMLElement>()
const scene = ref<SceneState>({ mix: 0, fall: 0, dim: 0, active: 0 })
const now = new Date()
const events = ref<SkyEvent[]>(upcomingSkyEvents(now))
let frame = 0
let context: gsap.Context | undefined

const activeNumber = computed(() => String(scene.value.active + 1).padStart(2, '0'))
const tiles = computed(() =>
  events.value.map((event) => {
    const days = daysUntil(event.date, now)
    return { ...event, count: days === 0 ? t('event.calendar.today') : `D-${days}`, when: formatUtc(event.date, true) }
  }),
)

const sectionId = (chapter: string): string => `event-${chapter}`

function measure(): void {
  frame = 0
  const tops = CHAPTERS.map((chapter) => document.getElementById(sectionId(chapter))?.getBoundingClientRect().top ?? 0)
  scene.value = readScene({ tops, viewport: window.innerHeight, motion: enabled.value })
}

function schedule(): void {
  if (!frame) frame = requestAnimationFrame(measure)
}

function go(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  scrollToElement(target)
  target.focus({ preventScroll: true })
}

function build(): void {
  context?.revert()
  context = undefined
  schedule()
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.from(element, {
        y: 36,
        autoAlpha: 0,
        duration: 1.1,
        ease: EASE.out,
        scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      })
    })
  }, root.value)
}

useEventListener(window, 'scroll', schedule, { passive: true })
useEventListener(window, 'resize', schedule, { passive: true })

onMounted(() => {
  watch([enabled, introDone], build, { immediate: true, flush: 'post' })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  context?.revert()
})
</script>

<template>
  <div ref="root" class="event scope-dark">
    <div class="event__sticky">
      <EventStage :mix="scene.mix" :fall="scene.fall" :dim="scene.dim" />
    </div>
    <div class="event__sticky event__sticky--hud">
      <div class="event__frame" aria-hidden="true" />
      <div class="event__bar" aria-hidden="true">
        <span>{{ t('event.simulation') }}</span>
        <span class="event__bar-center">{{ t('event.scroll') }}</span>
        <span>{{ activeNumber }} / 04</span>
      </div>
    </div>

    <nav class="event__rail" :aria-label="t('event.chaptersLabel')">
      <ol class="event__rail-list">
        <li v-for="(chapter, index) in CHAPTERS" :key="chapter">
          <a
            class="event__rail-link"
            :class="{ 'event__rail-link--active': scene.active === index }"
            :href="`#${sectionId(chapter)}`"
            :aria-current="scene.active === index ? 'location' : undefined"
            @click.prevent="go(sectionId(chapter))"
          >
            <span class="event__rail-mark" aria-hidden="true" />
            {{ t(`event.chapters.${chapter}`) }}
          </a>
        </li>
      </ol>
    </nav>

    <section :id="sectionId('signal')" class="chapter chapter--signal" tabindex="-1">
      <div class="signal">
        <p class="eyebrow" data-reveal>{{ t('event.signal.eyebrow') }}</p>
        <h1 class="signal__title" data-reveal>
          <span>{{ t('event.signal.titleA') }}</span>
          <span>{{ t('event.signal.titleB') }}</span>
        </h1>
        <p class="signal__body" data-reveal>{{ t('event.signal.body') }}</p>
        <a :href="`#${sectionId('calendar')}`" class="cut-link" data-reveal @click.prevent="go(sectionId('calendar'))">
          <span class="cut-link__mark" aria-hidden="true" />{{ t('event.signal.cta') }}
        </a>
      </div>
    </section>

    <section :id="sectionId('calendar')" class="chapter chapter--calendar" tabindex="-1" aria-labelledby="event-calendar-title">
      <div class="calendar">
        <p class="eyebrow" data-reveal>{{ t('event.calendar.eyebrow') }}</p>
        <h2 id="event-calendar-title" class="headline" data-reveal>
          <span>{{ t('event.calendar.titleA') }}</span>
          <span>{{ t('event.calendar.titleB') }}</span>
        </h2>
        <ul class="tiles">
          <li v-for="tile in tiles" :key="tile.id" class="tile" data-reveal>
            <p class="tile__kind">{{ t(`event.names.${tile.id}`) }} · {{ t(`event.kinds.${tile.kind}`) }}</p>
            <p class="tile__count">{{ tile.count }}</p>
            <p class="tile__date"><time :datetime="tile.date.toISOString()">{{ tile.when }}</time></p>
          </li>
        </ul>
        <p class="calendar__note" data-reveal>{{ t('event.calendar.note') }}</p>
      </div>
    </section>

    <section :id="sectionId('horizon')" class="chapter chapter--horizon" tabindex="-1" aria-labelledby="event-horizon-title">
      <div class="horizon">
        <div class="horizon__copy">
          <p class="horizon__kicker" data-reveal>{{ t('event.horizon.kicker') }}</p>
          <h2 id="event-horizon-title" class="horizon__title" data-reveal>
            <span>{{ t('event.horizon.titleA') }}</span>
            <span>{{ t('event.horizon.titleB') }}</span>
          </h2>
        </div>
        <aside class="facts" :aria-label="t('event.horizon.factsLabel')" data-reveal>
          <p class="eyebrow">{{ t('event.horizon.eyebrow') }}</p>
          <dl class="facts__list">
            <div v-for="index in FACT_COUNT" :key="index" class="facts__item">
              <dt>{{ t(`event.horizon.facts[${index - 1}].name`) }}</dt>
              <dd>
                <strong>{{ t(`event.horizon.facts[${index - 1}].value`) }}</strong>
                <span>{{ t(`event.horizon.facts[${index - 1}].detail`) }}</span>
              </dd>
            </div>
          </dl>
          <p class="facts__render">{{ t('event.horizon.render') }}</p>
        </aside>
      </div>
    </section>

    <section :id="sectionId('return')" class="chapter chapter--return" tabindex="-1" aria-labelledby="event-return-title">
      <div class="return">
        <p class="eyebrow" data-reveal>{{ t('event.return.eyebrow') }}</p>
        <h2 id="event-return-title" class="horizon__title" data-reveal>
          <span>{{ t('event.return.titleA') }}</span>
          <span>{{ t('event.return.titleB') }}</span>
        </h2>
        <div class="return__links" data-reveal>
          <RouterLink :to="ROUTES.observatory" class="cut-link"><span class="cut-link__mark" aria-hidden="true" />{{ t('event.return.toObservatory') }}</RouterLink>
          <RouterLink :to="ROUTES.control" class="cut-link"><span class="cut-link__mark" aria-hidden="true" />{{ t('event.return.toControl') }}</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.event {
  --cut: 1.125rem;
  --hud-text: #d9e2ff;
  --hud-dim: #aab8e6;
  --hud-line: rgb(170 190 255 / 0.3);
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
/* 모서리를 깎은 관제 화면 테두리 */
.event__frame {
  position: absolute;
  inset: calc(var(--chrome-height) + 0.5rem) var(--frame-inset) var(--frame-inset);
  background: var(--hud-line);
  clip-path: polygon(
    evenodd,
    var(--cut) 0,
    calc(100% - var(--cut)) 0,
    100% var(--cut),
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    var(--cut) 100%,
    0 calc(100% - var(--cut)),
    0 var(--cut),
    var(--cut) 0,
    var(--cut) 1px,
    calc(var(--cut) + 0.4px) 1px,
    1px calc(var(--cut) + 0.4px),
    1px calc(100% - var(--cut) - 0.4px),
    calc(var(--cut) + 0.4px) calc(100% - 1px),
    calc(100% - var(--cut) - 0.4px) calc(100% - 1px),
    calc(100% - 1px) calc(100% - var(--cut) - 0.4px),
    calc(100% - 1px) calc(var(--cut) + 0.4px),
    calc(100% - var(--cut) - 0.4px) 1px,
    var(--cut) 1px
  );
}
.event__bar {
  position: absolute;
  left: var(--frame-inset);
  right: var(--frame-inset);
  bottom: var(--frame-inset);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 3rem;
  padding: 0 calc(var(--cut) + 0.75rem);
  border-top: 1px solid var(--hud-line);
  /* 스크롤되는 본문이 지나가도 글자가 겹쳐 읽히지 않게 합니다 */
  background: rgb(0 3 12 / 0.86);
  color: var(--hud-text);
  font: 500 0.75rem var(--font-mono);
  text-transform: uppercase;
}
.event__rail {
  position: sticky;
  top: 50%;
  z-index: 3;
  width: fit-content;
  height: 0;
  margin-left: calc(var(--frame-inset) + 1rem);
}
.event__rail-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  transform: translateY(-50%);
}
.event__rail-link {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.25rem;
  color: var(--hud-dim);
  font: 500 0.75rem var(--font-mono);
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.25s ease;
}
.event__rail-link:hover,
.event__rail-link--active {
  color: #fff;
}
.event__rail-mark {
  width: 0.4375rem;
  height: 0.4375rem;
  border: 1px solid currentColor;
  transition: background-color 0.25s ease;
}
.event__rail-link--active .event__rail-mark {
  background: #fff;
}

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
.eyebrow {
  margin: 0 0 0.75rem;
  color: var(--hud-text);
  font: 500 0.75rem/1.5 var(--font-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.signal {
  position: relative;
  isolation: isolate;
  max-width: 44rem;
  padding-bottom: 1rem;
}
/* 물에 비친 빛 위에서도 글을 읽을 수 있게 뒤를 어둡게 합니다 */
.signal::before {
  content: '';
  position: absolute;
  inset: -2.5rem -6rem -1rem;
  z-index: -1;
  background: radial-gradient(closest-side, rgb(0 3 12 / 0.84) 55%, transparent);
}
.signal__title span,
.headline span,
.horizon__title span {
  display: block;
}
.signal__title {
  margin: 0;
  color: #eef2ff;
  font: 700 clamp(2rem, 4.2vw, 3.5rem) / 1.12 var(--font-display);
  font-stretch: 105%;
  text-shadow: 0 0 1.5rem #00030c;
}
.signal__body {
  max-width: 34rem;
  margin: 1rem auto 1.5rem;
  color: var(--hud-text);
  font-size: 1.0625rem;
  text-shadow: 0 0 1rem #00030c, 0 0 0.25rem #00030c;
}

/* 깎인 모서리는 장식 층에만 적용해 초점 표시가 잘리지 않게 합니다 */
.cut-link {
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
.cut-link::before,
.cut-link::after {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: polygon(0.75rem 0, 100% 0, 100% calc(100% - 0.75rem), calc(100% - 0.75rem) 100%, 0 100%, 0 0.75rem);
  transition: background-color 0.25s ease;
}
.cut-link::before {
  inset: 0;
  background: var(--hud-line);
}
.cut-link::after {
  inset: 1px;
  background: #06102f;
}
.cut-link:hover::after {
  background: #1a3fe0;
}
.cut-link__mark {
  width: 0.4375rem;
  height: 0.4375rem;
  background: #8aa8ff;
}

.chapter--calendar {
  align-items: center;
}
.calendar {
  width: 100%;
  max-width: 76rem;
  margin-inline: auto;
}
.headline {
  margin: 0 0 2.5rem;
  color: #eef2ff;
  font: 700 clamp(2.25rem, 6vw, 5rem) / 1.04 var(--font-display);
  font-stretch: 112%;
}
.headline span:last-child {
  margin-left: clamp(2rem, 10vw, 9rem);
}
.tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tile {
  position: relative;
  isolation: isolate;
  padding: 1.5rem 1.25rem;
}
.tile::before,
.tile::after {
  content: '';
  position: absolute;
  z-index: -1;
  clip-path: polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut));
}
.tile::before {
  inset: 0;
  background: var(--hud-line);
}
.tile::after {
  inset: 1px;
  background: rgb(4 10 34 / 0.88);
}
.tile p {
  margin: 0;
}
.tile__kind {
  min-height: 2.5rem;
  color: var(--hud-text);
  font: 500 0.8125rem/1.5 var(--font-mono);
}
.tile__count {
  margin-block: 0.75rem !important;
  color: #fff;
  font: 700 clamp(2.25rem, 4.2vw, 3.75rem) / 1 var(--font-display);
  font-variant-numeric: tabular-nums;
}
.tile__date {
  color: var(--hud-dim);
  font: 400 0.8125rem var(--font-mono);
}
.calendar__note {
  max-width: 44rem;
  margin: 1.5rem 0 0;
  color: var(--hud-text);
  font-size: 0.9375rem;
  text-shadow: 0 0 0.5rem #00030c;
}

/* 원반 위의 글을 읽을 수 있도록 아래쪽을 어둡게 합니다 */
.chapter--horizon {
  align-items: end;
  background: linear-gradient(to top, rgb(0 0 0 / 0.88), transparent 58%);
}
.horizon {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 23rem);
  align-items: end;
  gap: 2rem;
  width: 100%;
}
.horizon__kicker {
  margin: 0 0 0.5rem;
  color: #f1f1f7;
  font-size: 1rem;
  text-shadow: 0 0 0.75rem #000;
}
.horizon__title {
  margin: 0;
  color: #fff;
  font: 200 clamp(2.125rem, 5.4vw, 4.75rem) / 1.14 var(--font-display);
  font-stretch: 118%;
  letter-spacing: 0.06em;
  text-shadow: 0 0 1.25rem #000;
}
.facts {
  padding: 1.25rem;
  background: rgb(7 7 13 / 0.82);
  border: 1px solid rgb(255 255 255 / 0.22);
  backdrop-filter: blur(10px);
  color: #eceef6;
}
.facts__list {
  margin: 0;
}
.facts__item {
  padding-block: 0.625rem;
  border-top: 1px solid rgb(255 255 255 / 0.16);
}
.facts dt {
  font: 500 0.75rem var(--font-mono);
  color: #c9cbd8;
}
.facts dd {
  display: grid;
  margin: 0.125rem 0 0;
  font-size: 0.875rem;
  line-height: 1.45;
}
.facts strong {
  color: #fff;
  font-weight: 700;
}
.facts__render {
  margin: 0.5rem 0 0;
  padding-top: 0.625rem;
  border-top: 1px solid rgb(255 255 255 / 0.16);
  color: #c9cbd8;
  font-size: 0.8125rem;
  line-height: 1.45;
}

.chapter--return {
  align-items: center;
  justify-items: center;
  text-align: center;
  background: linear-gradient(to bottom, transparent, #000 80%);
}
.return__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
}

@media (max-width: 1000px) {
  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .horizon {
    grid-template-columns: minmax(0, 1fr);
  }
  /* 세로로 쌓이면 글이 블랙홀을 덮지 않도록 첫 화면 위쪽을 비웁니다 */
  .chapter--horizon {
    padding-top: 48svh;
  }
}
/* 좁은 화면에서는 왼쪽 목차가 본문을 가리므로 순서대로 스크롤해 읽습니다 */
@media (max-width: 899px) {
  .event__rail {
    display: none;
  }
  .chapter {
    padding-inline: 1.75rem;
  }
  .event__bar-center {
    display: none;
  }
}
@media (max-width: 480px) {
  .tiles {
    grid-template-columns: minmax(0, 1fr);
  }
  .tile {
    padding: 1rem 1.25rem;
  }
  .tile__kind {
    min-height: 0;
  }
}
</style>
