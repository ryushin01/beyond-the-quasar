import { watch } from 'vue'
import { createI18n } from 'vue-i18n'

import { readStorage, writeStorage } from '../lib/storage'
import en from './locales/en.json'
import ko from './locales/ko.json'

export type Locale = 'ko' | 'en'
export type Messages = typeof ko

const STORAGE_KEY = 'btq:locale'

const initial = readStorage<Locale>(STORAGE_KEY, navigator.language?.startsWith('en') ? 'en' : 'ko')

export const i18n = createI18n<[Messages], Locale, false>({
  legacy: false,
  locale: initial,
  fallbackLocale: 'en',
  messages: { ko, en },
})

export function syncDocumentLanguage(): void {
  watch(
    i18n.global.locale,
    (locale) => {
      document.documentElement.lang = locale
      writeStorage(STORAGE_KEY, locale)
    },
    { immediate: true },
  )
}
