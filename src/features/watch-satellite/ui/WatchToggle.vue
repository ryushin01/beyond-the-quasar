<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useWatchlist, type Satellite } from '@/entities/satellite'

const props = defineProps<{ satellite: Pick<Satellite, 'noradId' | 'name'> }>()

const { t } = useI18n()
const watchlist = useWatchlist()
const watched = computed(() => watchlist.has(props.satellite.noradId))
</script>

<template>
  <button
    type="button"
    class="watch"
    :class="{ 'watch--on': watched }"
    :aria-label="t('watch.toggle', { name: satellite.name })"
    :aria-pressed="watched"
    @click.stop="watchlist.toggle(satellite.noradId)"
  >
    <!-- 색이 아니라 채움 여부로도 상태를 구분합니다. -->
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17.1 6.4 20.2l1.3-6.3L3 9.6l6.3-.7z"
        :fill="watched ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="miter"
      />
    </svg>
  </button>
</template>

<style scoped>
.watch {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex: none;
  padding: 0;
  background: transparent;
  border: 0;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s ease, transform 0.4s var(--ease-out);
}
.watch:hover {
  color: var(--ink);
  transform: rotate(36deg);
}
.watch--on {
  color: var(--signal-text);
}
</style>
