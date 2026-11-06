<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { Satellite } from '../model/types'

/** inline: 버튼 안처럼 목록을 둘 수 없는 곳에서 span으로 렌더링합니다. */
defineProps<{ satellite: Satellite; compact?: boolean; inline?: boolean }>()
const { t, te } = useI18n()
</script>

<template>
  <component :is="inline ? 'span' : 'ul'" class="tags">
    <component :is="inline ? 'span' : 'li'" class="tag" :class="{ 'tag--mil': satellite.category === 'military' }">{{ t(`categories.${satellite.category}`) }}</component>
    <component :is="inline ? 'span' : 'li'" class="tag">{{ satellite.orbit }}</component>
    <component :is="inline ? 'span' : 'li'" v-if="!compact && satellite.owner" class="tag">{{ te(`owners.${satellite.owner}`) ? t(`owners.${satellite.owner}`) : satellite.owner }}</component>
    <component :is="inline ? 'span' : 'li'" v-if="satellite.dualUse" class="tag">{{ t('filter.dualUseTag') }}</component>
  </component>
</template>

<style scoped>
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tag {
  padding: 0.0625rem 0.375rem;
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font: 500 0.6875rem/1.4 var(--font-mono);
}
.tag--mil {
  border-color: var(--alert);
  color: var(--alert);
}
</style>
