<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { CATEGORIES, useSatelliteCatalog, type Category } from '@/entities/satellite'
import { SatelliteFilterPanel, useSatelliteFilter } from '@/features/filter-satellites'
import { EASE, gsap, useMotionPreference, useSmoothScroll } from '@/shared/motion'
import { SatelliteGallery } from '@/widgets/satellite-gallery'

useSmoothScroll()

const { t } = useI18n()
const route = useRoute()
const store = useSatelliteFilter()
const { enabled } = useMotionPreference()
const { satellites, fetchedAt, isPending, isError, refetch } = useSatelliteCatalog()

const root = ref<HTMLElement>()
const snapshotDate = computed(() => fetchedAt.value?.toISOString().slice(0, 10) ?? '—')
let context: gsap.Context | undefined

/** 홈의 플레이트에서 들어오면 해당 분류만 고른 상태로 시작합니다. */
watch(
  () => route.query.category,
  (category) => {
    if (typeof category === 'string' && (CATEGORIES as readonly string[]).includes(category)) {
      store.reset()
      store.toggleCategory(category as Category)
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.from('.catalog__title > span', { yPercent: 110, duration: 1.1, ease: EASE.out })
    gsap.from('.catalog__lead, .catalog__side', { autoAlpha: 0, y: 16, duration: 0.8, ease: EASE.soft, delay: 0.25, stagger: 0.08 })
  }, root.value)
})
onBeforeUnmount(() => context?.revert())
</script>

<template>
  <div ref="root" class="catalog">
    <header class="catalog__head">
      <h1 class="catalog__title"><span>{{ t('catalog.title') }}</span></h1>
      <div class="catalog__lead">
        <p>{{ t('catalog.lead') }}</p>
        <p class="catalog__stamp">{{ t('catalog.snapshot', { date: snapshotDate }) }}</p>
      </div>
    </header>

    <p v-if="isPending" role="status">{{ t('control.loading') }}</p>
    <div v-else-if="isError" role="alert">
      <p>{{ t('control.loadError') }}</p>
      <q-btn outline square no-caps :label="t('control.retry')" @click="refetch()" />
    </div>
    <div v-else class="catalog__body">
      <aside class="catalog__side" :aria-label="t('catalog.filters')">
        <SatelliteFilterPanel :satellites="satellites" />
      </aside>
      <SatelliteGallery :satellites="satellites" class="catalog__gallery" />
    </div>
  </div>
</template>

<style scoped>
.catalog {
  padding: clamp(2rem, 5vw, 4.5rem) var(--margin) clamp(4rem, 8vw, 7rem);
}
.catalog__head {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: end;
  gap: 1rem var(--gutter);
  margin-bottom: clamp(2rem, 5vw, 4rem);
}
.catalog__title {
  grid-column: span 8;
  margin: 0;
  overflow: hidden;
  padding-bottom: 0.14em;
  font-size: clamp(2.75rem, 9vw, 9rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
}
.catalog__title > span {
  display: inline-block;
}
.catalog__lead {
  grid-column: span 4;
  font-size: 1rem;
  line-height: 1.5;
}
.catalog__lead p {
  margin: 0;
}
.catalog__stamp {
  margin-top: 0.5rem !important;
  color: var(--muted);
  font: 400 0.75rem var(--font-mono);
}
.catalog__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem var(--gutter);
}
@media (min-width: 1000px) {
  .catalog__body {
    grid-template-columns: 20rem minmax(0, 1fr);
    align-items: start;
  }
  .catalog__side {
    position: sticky;
    top: 4.5rem;
    max-height: calc(100dvh - 5rem);
    overflow-y: auto;
    padding-right: 0.5rem;
  }
}
@media (max-width: 760px) {
  .catalog__title,
  .catalog__lead {
    grid-column: 1 / -1;
  }
}
</style>
