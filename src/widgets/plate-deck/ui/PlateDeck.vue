<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { CATEGORIES, countBy, type Category, type Mission, type Satellite } from '@/entities/satellite'
import { ROUTES } from '@/shared/config'
import { gsap, ScrollTrigger, useMotionPreference } from '@/shared/motion'

const props = defineProps<{ satellites: Satellite[] }>()

const { t } = useI18n()
const { enabled } = useMotionPreference()
const root = ref<HTMLElement>()

const LEAD_MISSION: Record<Category, Mission> = {
  military: 'milsatcom',
  navigation: 'pnt',
  'earth-observation': 'imaging',
  weather: 'weather',
  communications: 'satcom',
  science: 'science',
  crewed: 'crewed',
}

const counts = computed(() => countBy(props.satellites, (item) => item.category))
let context: gsap.Context | undefined

function build(): void {
  context?.revert()
  context = undefined
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.matchMedia().add('(min-width: 1000px)', () => {
      const plates = gsap.utils.toArray<HTMLElement>('.deck__plate')
      const row = root.value?.querySelector<HTMLElement>('.deck__row')
      if (!row) return
      const center = row.getBoundingClientRect().left + row.clientWidth / 2
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: root.value, start: 'top top', end: '+=180%', pin: true, scrub: 0.5 },
      })
      // 한 벌로 쌓여 있던 플레이트를 카드 돌리듯 펼칩니다.
      plates.forEach((plate, index) => {
        const box = plate.getBoundingClientRect()
        const offset = center - (box.left + box.width / 2)
        timeline.fromTo(
          plate,
          { x: offset + (index - 3) * 4, y: (index - 3) * -4, rotate: (index - 3) * 3.5, zIndex: 10 - index },
          { x: 0, y: 0, rotate: 0, duration: 1, ease: 'power3.inOut' },
          0.12 * (plates.length - 1 - index),
        )
      })
    })
  }, root.value)
  ScrollTrigger.refresh()
}

onMounted(() => {
  watch(enabled, build, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section ref="root" class="deck" aria-labelledby="deck-title">
    <header class="deck__head">
      <div>
        <p class="deck__eyebrow">{{ t('home.plateEyebrow') }}</p>
        <h2 id="deck-title" class="deck__title">{{ t('home.plateTitle') }}</h2>
      </div>
      <p class="deck__hint">{{ t('home.plateHint') }}</p>
    </header>
    <ul class="deck__row">
      <li v-for="(category, index) in CATEGORIES" :key="category" class="deck__plate">
        <RouterLink
          :to="{ path: ROUTES.catalog, query: { category } }"
          class="deck__card"
          :class="{ 'deck__card--light': index % 2 === 1, 'deck__card--mil': category === 'military' }"
        >
          <span class="deck__top">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <span>{{ t(`missionCodes.${LEAD_MISSION[category]}`) }}</span>
          </span>
          <span class="deck__code" aria-hidden="true">{{ t(`categoryCodes.${category}`) }}</span>
          <span class="deck__bottom">
            <span class="deck__name">{{ t(`categories.${category}`) }}</span>
            <span class="deck__count">{{ t('home.plateCount', { n: counts.get(category) ?? 0 }) }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.deck {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
  min-height: 100svh;
  padding: 5rem var(--margin);
  overflow: hidden;
  background: #1a3fe0;
  color: #fff;
}
.deck__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}
.deck__eyebrow {
  margin: 0 0 0.5rem;
  font: 500 0.8125rem var(--font-mono);
}
.deck__title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 4.75rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.deck__hint {
  margin: 0;
  font-size: 0.9375rem;
}
.deck__row {
  display: flex;
  gap: 0.75rem;
  margin: 0;
  padding: 0.75rem 0;
  list-style: none;
}
.deck__plate {
  flex: 1 0 0;
  min-width: 0;
}
.deck__card {
  --card-bg: #000;
  --card-ink: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  aspect-ratio: 5 / 8;
  container-type: inline-size;
  padding: 0.875rem;
  background: var(--card-bg);
  color: var(--card-ink);
  border-radius: 0.875rem;
  box-shadow: 0 1.25rem 2.5rem rgb(0 0 0 / 0.3);
  text-decoration: none;
  transition: transform 0.55s var(--ease-out);
}
.deck__card:hover,
.deck__card:focus-visible {
  transform: translateY(-1rem) rotate(-1.5deg);
}
.deck__card:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
.deck__card--light {
  --card-bg: #fff;
  --card-ink: #000;
}
.deck__card--mil {
  background-image: repeating-linear-gradient(135deg, transparent 0 14px, rgb(255 178 36 / 0.22) 14px 16px);
}
.deck__top {
  display: flex;
  justify-content: space-between;
  font: 500 0.6875rem var(--font-mono);
}
.deck__code {
  font: 800 30cqi / 0.9 var(--font-display);
  white-space: nowrap;
  font-stretch: 112%;
  letter-spacing: -0.03em;
  transition: font-stretch 0.5s var(--ease-out);
}
.deck__card:hover .deck__code {
  font-stretch: 62%;
}
.deck__bottom {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.deck__name {
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.25;
}
.deck__count {
  font: 500 0.75rem var(--font-mono);
}
@media (max-width: 999px) {
  .deck {
    padding-right: 0;
  }
  .deck__row {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-right: var(--margin);
  }
  .deck__plate {
    flex: 0 0 min(62vw, 15rem);
    scroll-snap-align: start;
  }
}
</style>
