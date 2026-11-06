import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/geist-mono/index.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import 'quasar/dist/quasar.prod.css'
import 'virtual:uno.css'
import './styles/global.css'

import { defineSetupVue3 } from '@histoire/plugin-vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { Notify, Quasar } from 'quasar'
import iconSet from 'quasar/icon-set/svg-material-symbols-sharp'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'

export const setupVue3 = defineSetupVue3(({ app }) => {
  document.documentElement.dataset.theme = 'dark'
  app.use(createPinia())
  app.use(i18n)
  app.use(VueQueryPlugin)
  app.use(Quasar, { plugins: { Notify }, iconSet, config: { dark: true } })
  app.use(createRouter({ history: createMemoryHistory(), routes: [{ path: '/:all(.*)*', component: { render: () => null } }] }))
})
