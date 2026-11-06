<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { useSatelliteCatalog } from '@/entities/satellite'
import { TARGETS } from '@/entities/sky'
import { SiteSelect } from '@/features/change-site'
import { ObservationLog } from '@/features/log-observation'
import { formatUtc } from '@/shared/lib'
import { EASE, gsap, useMotionPreference, useSmoothScroll } from '@/shared/motion'
import { PanelFrame, ToggleChip } from '@/shared/ui'
import { AltitudeChart } from '@/widgets/altitude-chart'
import { NightBrief } from '@/widgets/night-brief'
import { SkyDome } from '@/widgets/sky-dome'
import { TargetList } from '@/widgets/target-list'

useSmoothScroll()

const { t } = useI18n()
const clock = useMissionClock()
const { enabled } = useMotionPreference()
const { satellites } = useSatelliteCatalog()

const root = ref<HTMLElement>()
const selectedId = ref(TARGETS[0]!.id)
const offsetHours = ref(0)
const showSatellites = ref(true)

const selected = computed(() => TARGETS.find((target) => target.id === selectedId.value) ?? TARGETS[0]!)
const skyDate = computed(() => new Date(clock.now.getTime() + offsetHours.value * 3_600_000))
const offsetLabel = computed(() => (offsetHours.value === 0 ? t('observatory.now') : t('observatory.skyTimeValue', { n: offsetHours.value })))

let context: gsap.Context | undefined

onMounted(() => {
  clock.start()
  if (!enabled.value) return
  context = gsap.context(() => {
    gsap.from('.observatory__title > span', { yPercent: 110, duration: 1.1, ease: EASE.out })
    gsap.from('.observatory__intro > *', { autoAlpha: 0, y: 16, duration: 0.8, ease: EASE.soft, delay: 0.25, stagger: 0.08 })
    gsap.from('.observatory__dome', { scale: 0.86, rotate: -14, autoAlpha: 0, duration: 1.4, ease: EASE.out, delay: 0.15 })
  }, root.value)
})
onBeforeUnmount(() => {
  clock.stop()
  context?.revert()
})
</script>

<template>
  <div ref="root" class="observatory">
    <header class="observatory__head">
      <h1 class="observatory__title"><span>{{ t('observatory.title') }}</span></h1>
      <div class="observatory__intro">
        <p>{{ t('observatory.lead') }}</p>
        <SiteSelect :label="t('observatory.site')" />
      </div>
    </header>

    <PanelFrame :title="t('observatory.brief')" code="BRF" class="observatory__brief">
      <NightBrief :date="clock.now" />
    </PanelFrame>

    <div class="observatory__sky">
      <PanelFrame :title="t('observatory.sky')" code="SKY" class="observatory__panel">
        <div class="observatory__dome">
          <SkyDome :date="skyDate" :selected-id="selectedId" :satellites="showSatellites ? satellites : []" @select="selectedId = $event" />
        </div>
        <div class="observatory__controls">
          <div class="observatory__slider">
            <p class="label-mono" aria-hidden="true">{{ t('observatory.skyTime') }} · {{ offsetLabel }} · {{ formatUtc(skyDate, true) }}</p>
            <q-slider
              v-model="offsetHours"
              :min="0"
              :max="24"
              :step="1"
              color="primary"
              :aria-label="t('observatory.skyTime')"
              :aria-valuetext="offsetLabel"
            />
          </div>
          <ToggleChip :label="t('observatory.showSatellites')" :pressed="showSatellites" @toggle="showSatellites = !showSatellites" />
        </div>
      </PanelFrame>

      <div class="observatory__column">
        <PanelFrame :title="t('observatory.targets')" code="TGT">
          <TargetList :date="skyDate" :selected-id="selectedId" @select="selectedId = $event" />
        </PanelFrame>
      </div>
    </div>

    <PanelFrame :title="`${t('observatory.chart')} · ${selected.name}`" code="ALT" class="observatory__chart">
      <div class="observatory__pad"><AltitudeChart :target="selected" :from="clock.now" /></div>
    </PanelFrame>

    <PanelFrame :title="t('log.title')" code="LOG" class="observatory__log">
      <div class="observatory__pad"><ObservationLog :target-name="selected.name" /></div>
    </PanelFrame>
  </div>
</template>

<style scoped>
.observatory {
  padding: clamp(2rem, 5vw, 4.5rem) var(--margin) clamp(4rem, 8vw, 7rem);
}
.observatory__head {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: end;
  gap: 1rem var(--gutter);
  margin-bottom: clamp(2rem, 5vw, 4rem);
}
.observatory__title {
  grid-column: span 8;
  margin: 0;
  overflow: hidden;
  padding-bottom: 0.14em;
  font-size: clamp(2.75rem, 9vw, 9rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
}
.observatory__title > span {
  display: inline-block;
}
.observatory__intro {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.observatory__intro p {
  margin: 0;
  line-height: 1.5;
}
.observatory__brief,
.observatory__sky,
.observatory__chart,
.observatory__log {
  border: 1px solid var(--line);
  margin-bottom: var(--gutter);
}
.observatory__sky {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.observatory__dome {
  padding: 1rem;
  max-width: 44rem;
  width: 100%;
  margin-inline: auto;
}
.observatory__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--line);
}
.observatory__slider {
  flex: 1 1 18rem;
  min-width: 0;
}
.observatory__slider p {
  margin: 0;
}
.observatory__pad {
  padding: 1rem;
}
@media (min-width: 1000px) {
  .observatory__sky {
    grid-template-columns: minmax(0, 1fr) 24rem;
  }
  .observatory__column {
    border-left: 1px solid var(--line);
  }
}
@media (max-width: 760px) {
  .observatory__title,
  .observatory__intro {
    grid-column: 1 / -1;
  }
}
</style>
