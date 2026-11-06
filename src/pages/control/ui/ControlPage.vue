<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMissionClock } from '@/entities/clock'
import { filterSatellites, useSatelliteCatalog, useTracking } from '@/entities/satellite'
import { SiteSelect } from '@/features/change-site'
import { SatelliteFilterPanel, useSatelliteFilter } from '@/features/filter-satellites'
import { TimeControls } from '@/features/time-warp'
import { EASE, gsap, useMotionPreference } from '@/shared/motion'
import { PanelFrame } from '@/shared/ui'
import { GroundTrackMap } from '@/widgets/ground-track-map'
import { MissionPanels } from '@/widgets/mission-panels'
import { SatelliteRoster } from '@/widgets/satellite-roster'
import { TelemetryPanel } from '@/widgets/telemetry-panel'

const { t } = useI18n()
const clock = useMissionClock()
const tracking = useTracking()
const filterStore = useSatelliteFilter()
const { enabled } = useMotionPreference()
const { satellites, isPending, isError, refetch } = useSatelliteCatalog()

const root = ref<HTMLElement>()
const filtered = computed(() => filterSatellites(satellites.value, filterStore.filter))
const tracked = computed(() => satellites.value.find((item) => item.noradId === tracking.trackedId) ?? satellites.value[0] ?? null)

onMounted(() => clock.start())
onBeforeUnmount(() => clock.stop())

/** 데이터가 준비되면 패널이 차례로 켜집니다. */
watch(
  isPending,
  (pending) => {
    if (pending || !enabled.value) return
    requestAnimationFrame(() => {
      if (!root.value) return
      gsap.from(root.value.querySelectorAll('.console__cell'), { autoAlpha: 0, y: 14, duration: 0.7, ease: EASE.out, stagger: 0.06, clearProps: 'all' })
    })
  },
  { immediate: true },
)
</script>

<template>
  <div ref="root" class="console">
    <h1 class="sr-only">{{ t('control.title') }}</h1>

    <p v-if="isPending" class="console__state" role="status">{{ t('control.loading') }}</p>
    <div v-else-if="isError" class="console__state" role="alert">
      <p>{{ t('control.loadError') }}</p>
      <q-btn outline square no-caps :label="t('control.retry')" @click="refetch()" />
    </div>

    <template v-else>
      <PanelFrame :title="t('control.roster')" code="AST" class="console__cell console__roster">
        <div class="console__filters"><SatelliteFilterPanel :satellites="satellites" dense /></div>
        <SatelliteRoster :satellites="satellites" />
      </PanelFrame>

      <PanelFrame :title="t('control.map')" code="MAP" class="console__cell console__map">
        <GroundTrackMap :satellites="filtered" :tracked="tracked" @select="tracking.trackedId = $event" />
        <div class="console__time"><TimeControls /></div>
      </PanelFrame>

      <div class="console__side">
        <PanelFrame :title="t('control.telemetry')" code="TLM" class="console__cell">
          <template #actions><div class="console__site"><SiteSelect :label="t('control.site')" /></div></template>
          <TelemetryPanel v-if="tracked" :satellite="tracked" />
        </PanelFrame>
        <MissionPanels v-if="tracked" class="console__cell" :satellite="tracked" :satellites="satellites" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.console {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.console__state {
  padding: 3rem var(--margin);
}
.console__roster,
.console__map,
.console__side {
  border-bottom: 1px solid var(--line);
}
.console__filters {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--line);
}
.console__roster :deep(.roster__list) {
  max-height: 24rem;
}
.console__map {
  min-height: 34rem;
}
.console__time {
  padding: 0.625rem 1rem;
  border-top: 1px solid var(--line);
}
.console__site {
  min-width: 9rem;
}
.console__side {
  display: flex;
  flex-direction: column;
}

@media (min-width: 1100px) {
  .console {
    grid-template-columns: 19rem minmax(0, 1fr) 23rem;
    height: calc(100dvh - var(--chrome-height));
    min-height: 40rem;
  }
  .console__roster,
  .console__map,
  .console__side {
    min-height: 0;
    border-bottom: 0;
  }
  .console__roster {
    border-right: 1px solid var(--line);
  }
  .console__roster :deep(.roster__list) {
    max-height: none;
  }
  .console__side {
    border-left: 1px solid var(--line);
    overflow-y: auto;
  }
}
</style>
