<script setup lang="ts">
import { symSharpSearch } from '@quasar/extras/material-symbols-sharp'
import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CommandPaletteBody from './CommandPaletteBody.vue'

const { t } = useI18n()
const open = ref(false)
const body = ref<InstanceType<typeof CommandPaletteBody>>()
const isMac = /mac/i.test(navigator.userAgent)

// 수정 키가 있는 단축키라 음성 입력이나 글자 입력과 충돌하지 않습니다(KWCAG 6.1.4).
useEventListener(document, 'keydown', (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
  }
})
</script>

<template>
  <button
    type="button"
    class="trigger"
    aria-haspopup="dialog"
    :aria-expanded="open"
    aria-keyshortcuts="Control+K Meta+K"
    @click="open = true"
  >
    <q-icon :name="symSharpSearch" size="1.125rem" />
    <span class="trigger__label">{{ t('palette.open') }}</span>
    <kbd class="trigger__key" aria-hidden="true">{{ isMac ? '⌘K' : 'Ctrl K' }}</kbd>
  </button>

  <q-dialog v-model="open" :aria-label="t('palette.label')" position="top" transition-show="fade" transition-hide="fade" @show="body?.focus()">
    <CommandPaletteBody ref="body" class="palette-offset" @close="open = false" />
  </q-dialog>
</template>

<style scoped>
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  justify-content: center;
  padding: 0 0.5rem;
  background: transparent;
  border: 0;
  color: var(--ink);
  font: 500 0.8125rem var(--font-sans);
  cursor: pointer;
}
.trigger:hover {
  color: var(--signal-text);
}
.trigger__key {
  padding: 0.0625rem 0.3125rem;
  border: 1px solid var(--line-strong);
  color: var(--muted);
  font: 400 0.6875rem var(--font-mono);
}
.palette-offset {
  margin-top: 12vh;
}
@media (max-width: 860px) {
  /* 좁은 화면에서는 아이콘만 남기되 접근 가능한 이름은 유지합니다. */
  .trigger__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .trigger__key {
    display: none;
  }
}
</style>
