<script setup lang="ts">
import { symSharpArrowOutward } from '@quasar/extras/material-symbols-sharp'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ROUTES } from '@/shared/config'
import { EASE, gsap, useMotionPreference } from '@/shared/motion'

const { t } = useI18n()
const { enabled } = useMotionPreference()
const root = ref<HTMLElement>()

const systems = [
  { to: ROUTES.control, title: 'home.systemControl', desc: 'home.systemControlDesc', code: 'C2' },
  { to: ROUTES.catalog, title: 'home.systemCatalog', desc: 'home.systemCatalogDesc', code: 'DB' },
  { to: ROUTES.observatory, title: 'home.systemObservatory', desc: 'home.systemObservatoryDesc', code: 'OBS' },
]

let context: gsap.Context | undefined

function build(): void {
  context?.revert()
  context = undefined
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.from('.systems__row', {
      yPercent: 30,
      autoAlpha: 0,
      duration: 1,
      ease: EASE.out,
      stagger: 0.12,
      scrollTrigger: { trigger: root.value, start: 'top 75%' },
    })
  }, root.value)
}

onMounted(() => {
  watch(enabled, build, { immediate: true, flush: 'post' })
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section ref="root" class="systems scope-invert" aria-labelledby="systems-title">
    <h2 id="systems-title" class="systems__eyebrow">{{ t('home.systemsEyebrow') }}</h2>
    <ul class="systems__list">
      <li v-for="system in systems" :key="system.to" class="systems__row">
        <RouterLink :to="system.to" class="systems__link">
          <span class="systems__code" aria-hidden="true">{{ system.code }}</span>
          <span class="systems__title">{{ t(system.title) }}</span>
          <span class="systems__desc">{{ t(system.desc) }}</span>
          <q-icon :name="symSharpArrowOutward" class="systems__arrow" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.systems {
  padding: clamp(4rem, 10vw, 9rem) var(--margin);
  background: var(--paper);
  color: var(--ink);
}
.systems__eyebrow {
  margin: 0 0 2rem;
  font: 500 0.8125rem var(--font-mono);
  color: var(--muted);
}
.systems__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: 1px solid var(--line-strong);
}
.systems__row {
  border-top: 1px solid var(--line-strong);
}
.systems__link {
  position: relative;
  display: grid;
  grid-template-columns: 4rem minmax(0, 1.3fr) minmax(0, 1fr) 3.5rem;
  align-items: center;
  gap: var(--gutter);
  padding: clamp(1.25rem, 3vw, 2.75rem) 0;
  isolation: isolate;
  color: var(--ink);
  text-decoration: none;
  transition: color 0.3s ease, padding 0.6s var(--ease-out);
}
/* 호버하면 아래에서 판이 차오르며 글자색이 뒤집힙니다 */
.systems__link::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--ink);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.55s var(--ease-out);
}
.systems__link:hover,
.systems__link:focus-visible {
  padding-inline: 1.5rem;
  color: var(--paper);
}
.systems__link:hover::before,
.systems__link:focus-visible::before {
  transform: scaleY(1);
}
.systems__code {
  font: 500 0.8125rem var(--font-mono);
}
.systems__title {
  font-size: clamp(1.875rem, 5vw, 5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.systems__desc {
  font-size: clamp(0.9375rem, 1.2vw, 1.125rem);
  line-height: 1.45;
}
.systems__arrow {
  justify-self: end;
  font-size: clamp(1.75rem, 3vw, 3rem);
  transition: transform 0.55s var(--ease-out);
}
.systems__link:hover .systems__arrow {
  transform: translate(0.25rem, -0.25rem) rotate(45deg);
}
@media (max-width: 760px) {
  .systems__link {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .systems__code {
    grid-column: 1 / -1;
  }
  .systems__desc {
    grid-column: 1;
  }
  .systems__arrow {
    grid-column: 2;
    grid-row: 2;
  }
}
</style>
