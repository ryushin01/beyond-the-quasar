<script setup lang="ts">
import {
  symSharpDarkMode,
  symSharpLightMode,
  symSharpPause,
  symSharpPlayArrow,
} from '@quasar/extras/material-symbols-sharp'
import { useQuasar } from 'quasar'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { readStorage, writeStorage } from '@/shared/lib'
import { useMotionPreference } from '@/shared/motion'

const THEME_KEY = 'btq:theme'

const { t, locale } = useI18n()
const $q = useQuasar()
const motion = useMotionPreference()

const isDark = computed(() => $q.dark.isActive)
$q.dark.set(readStorage(THEME_KEY, 'dark') === 'dark')
watch(
  isDark,
  (dark) => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    writeStorage(THEME_KEY, dark ? 'dark' : 'light')
  },
  { immediate: true },
)
</script>

<template>
  <div class="prefs">
    <button
      type="button"
      class="prefs__btn prefs__btn--text"
      :lang="locale === 'ko' ? 'en' : 'ko'"
      :aria-label="locale === 'ko' ? t('prefs.toEnglish') : t('prefs.toKorean')"
      @click="locale = locale === 'ko' ? 'en' : 'ko'"
    >
      {{ locale === 'ko' ? 'EN' : 'KO' }}
    </button>
    <button type="button" class="prefs__btn" :aria-label="isDark ? t('prefs.themeLight') : t('prefs.themeDark')" @click="$q.dark.toggle()">
      <q-icon :name="isDark ? symSharpLightMode : symSharpDarkMode" size="1.125rem" />
    </button>
    <button
      type="button"
      class="prefs__btn"
      :aria-label="motion.enabled.value ? t('prefs.motionPause') : t('prefs.motionPlay')"
      :aria-pressed="!motion.enabled.value"
      :disabled="motion.reduced.value === 'reduce'"
      @click="motion.toggle()"
    >
      <q-icon :name="motion.enabled.value ? symSharpPause : symSharpPlayArrow" size="1.125rem" />
    </button>
  </div>
</template>

<style scoped>
.prefs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.prefs__btn {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: 1px solid transparent;
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.18s ease;
}
.prefs__btn:hover:not(:disabled) {
  border-color: var(--line-strong);
}
.prefs__btn:disabled {
  color: var(--muted);
  cursor: default;
}
.prefs__btn--text {
  font: 600 0.8125rem var(--font-mono);
}
</style>
