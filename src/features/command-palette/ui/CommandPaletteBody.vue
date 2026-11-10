<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { SITES, useObserver } from '@/entities/observer'
import { useSatelliteCatalog, useTracking, useWatchlist } from '@/entities/satellite'
import { ROUTES } from '@/shared/config'

import { searchCommands, type CommandItem } from '../lib/search'

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()
const observer = useObserver()
const tracking = useTracking()
const watchlist = useWatchlist()
const { satellites } = useSatelliteCatalog()

const query = ref('')
const activeIndex = ref(0)
const input = ref<HTMLInputElement>()
const list = ref<HTMLElement>()

const results = computed(() =>
  searchCommands(query.value, {
    pages: [
      { to: ROUTES.control, label: t('nav.control') },
      { to: ROUTES.catalog, label: t('nav.catalog') },
      { to: ROUTES.observatory, label: t('nav.observatory') },
      { to: ROUTES.event, label: t('nav.event') },
    ],
    sites: SITES.map((site) => ({ id: site.id, label: t(`sites.${site.id}`) })),
    satellites: satellites.value,
    watched: watchlist.ids,
  }),
)
const activeId = computed(() => {
  const item = results.value[activeIndex.value]
  return item ? `palette-${item.id}` : undefined
})

watch(results, () => (activeIndex.value = 0))
watch(activeIndex, () => {
  void nextTick(() => list.value?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' }))
})

function move(step: number): void {
  const count = results.value.length
  if (count) activeIndex.value = (activeIndex.value + step + count) % count
}

function run(item: CommandItem | undefined): void {
  if (!item) return
  if (item.kind === 'page') void router.push(item.to)
  if (item.kind === 'satellite') {
    tracking.trackedId = item.satellite.noradId
    void router.push({ path: ROUTES.control, query: { sat: item.satellite.noradId } })
  }
  if (item.kind === 'site') {
    observer.siteId = item.siteId
    $q.notify({ message: t('palette.siteChanged', { site: item.label }), position: 'bottom', timeout: 2500 })
  }
  emit('close')
}

const kindLabel = (item: CommandItem): string => {
  if (item.kind === 'satellite') return `#${item.satellite.noradId}`
  return t(`palette.kind.${item.kind}`)
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="palette">
    <input
      ref="input"
      v-model="query"
      class="palette__input"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="true"
      aria-controls="palette-results"
      :aria-activedescendant="activeId"
      :aria-label="t('palette.label')"
      :placeholder="t('palette.placeholder')"
      autocomplete="off"
      spellcheck="false"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="run(results[activeIndex])"
    />
    <ul id="palette-results" ref="list" class="palette__list" role="listbox" :aria-label="t('palette.results')">
      <li
        v-for="(item, index) in results"
        :id="`palette-${item.id}`"
        :key="item.id"
        class="palette__option"
        :class="{ 'palette__option--mil': item.kind === 'satellite' && item.satellite.category === 'military' }"
        role="option"
        :aria-selected="index === activeIndex"
        @click="run(item)"
        @pointermove="activeIndex = index"
      >
        <span class="palette__name">{{ item.label }}</span>
        <span class="palette__kind">{{ kindLabel(item) }}</span>
      </li>
    </ul>
    <p class="palette__foot" role="status">
      {{ results.length ? t('palette.count', { n: results.length }) : t('palette.empty') }}
    </p>
  </div>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  width: min(36rem, 92vw);
  max-height: min(32rem, 80vh);
  background: var(--raised);
  color: var(--ink);
  border: 1px solid var(--line-strong);
}
.palette__input {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  color: var(--ink);
  font: 600 1.125rem var(--font-sans);
  outline: none;
}
.palette__input::placeholder {
  color: var(--muted);
  font-weight: 400;
}
.palette__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}
.palette__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: padding-left 0.3s var(--ease-out);
}
.palette__option[aria-selected='true'] {
  padding-left: 1.375rem;
  box-shadow: inset 4px 0 0 var(--signal);
  background: var(--paper);
}
.palette__name {
  font-weight: 600;
  font-size: 0.9375rem;
}
.palette__option--mil .palette__name::before {
  content: '◆ ';
  color: var(--alert);
}
.palette__kind {
  flex: none;
  color: var(--muted);
  font: 400 0.75rem var(--font-mono);
}
.palette__foot {
  margin: 0;
  padding: 0.5rem 1rem;
  color: var(--muted);
  font: 500 0.75rem var(--font-mono);
}
</style>
