// 제목 Oswald(영문)·오르빗(한글), 본문 Gothic A1, 좌표·시각 Roboto Mono(영문·숫자)·나눔고딕코딩(한글)
import '@fontsource-variable/oswald/index.css'
import '@fontsource/orbit/400.css'
import '@fontsource/gothic-a1/400.css'
import '@fontsource/gothic-a1/700.css'
import '@fontsource-variable/roboto-mono/index.css'
import '@fontsource/nanum-gothic-coding/400.css'
import '@fontsource/nanum-gothic-coding/700.css'
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
