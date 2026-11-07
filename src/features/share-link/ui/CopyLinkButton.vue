<script setup lang="ts">
import { symSharpLink } from '@quasar/extras/material-symbols-sharp'
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

/** 필터와 위성이 주소에 담겨 있으므로 현재 주소를 그대로 복사합니다. */
async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    message.value = t('share.copied')
  } catch {
    message.value = t('share.failed')
  }
  clearTimeout(timer)
  timer = setTimeout(() => (message.value = ''), 3000)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span class="share">
    <button type="button" class="share__btn" @click="copy">
      <q-icon :name="symSharpLink" size="1rem" />
      {{ t('share.copy') }}
    </button>
    <span class="share__status" role="status">{{ message }}</span>
  </span>
</template>

<style scoped>
.share {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.share__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
  padding: 0 0.5rem;
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font: 500 0.75rem var(--font-sans);
  cursor: pointer;
}
.share__btn:hover {
  background: var(--ink);
  color: var(--paper);
}
.share__status {
  color: var(--signal-text);
  font: 500 0.75rem var(--font-sans);
}
</style>
