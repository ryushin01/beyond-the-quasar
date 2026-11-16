<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Pass } from '@/entities/satellite'
import { downloadText, formatNumber, formatUtc, icsDate, toIcs } from '@/shared/lib'

export interface PassExportItem {
  noradId: number
  name: string
  passes: (Pass & { visible?: boolean })[]
}

const props = defineProps<{ items: PassExportItem[]; siteName: string; filename: string }>()

const { t } = useI18n()
const count = computed(() => props.items.reduce((sum, item) => sum + item.passes.length, 0))

/** 예측한 통과를 달력 일정(.ics)으로 내려받습니다. 같은 통과를 다시 받아도 달력이 겹쳐 넣지 않도록 위성·시작 시각으로 UID를 정합니다. */
function download(): void {
  const events = props.items.flatMap((item) =>
    item.passes.map((pass) => ({
      uid: `pass-${item.noradId}-${icsDate(pass.aos)}@beyond-the-quasar`,
      start: pass.aos,
      end: pass.los,
      title: `${t('exportPasses.title', { name: item.name, max: formatNumber(pass.maxElevation, 0) })}${pass.visible ? ` · ${t('passes.visible')}` : ''}`,
      description: t('exportPasses.description', {
        aos: formatNumber(pass.aosAzimuth, 0),
        peak: formatUtc(pass.maxAt),
        los: formatNumber(pass.losAzimuth, 0),
      }),
      location: props.siteName,
    })),
  )
  downloadText(props.filename, toIcs(events, { productId: '-//Beyond the Quasar//Pass schedule//KO' }), 'text/calendar;charset=utf-8')
}
</script>

<template>
  <button type="button" class="export" :disabled="!count" @click="download">{{ t('exportPasses.button', { n: count }) }}</button>
</template>

<style scoped>
.export {
  min-height: 2rem;
  padding: 0;
  background: none;
  border: 0;
  color: var(--ink);
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
}
.export:disabled {
  color: var(--muted);
  cursor: default;
  text-decoration: none;
}
</style>
