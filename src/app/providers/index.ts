import { VueQueryPlugin } from '@tanstack/vue-query'
import iconSet from 'quasar/icon-set/svg-material-symbols-sharp'
import { createPinia } from 'pinia'
import { Dark, Notify, Quasar } from 'quasar'
import type { App } from 'vue'

import { i18n } from '@/shared/i18n'

import { router } from './router'

export function installProviders(app: App): void {
  app.use(createPinia())
  app.use(i18n)
  app.use(router)
  app.use(VueQueryPlugin)
  app.use(Quasar, { plugins: { Dark, Notify }, iconSet, config: { dark: true } })
}
