// 제목 Oswald(영문), 본문 영문 Gothic A1, 한글 에이투지체, 좌표·시각 Roboto Mono(영문·숫자)·나눔고딕코딩(한글)
import '@fontsource-variable/oswald/index.css'
import '@fontsource/gothic-a1/latin-400.css'
import '@fontsource/gothic-a1/latin-700.css'
import './styles/fonts/a2z.css'
import './styles/fonts/a2z-rest.css'
import '@fontsource-variable/roboto-mono/index.css'
import './styles/fonts/btq-coding.css'
import '@fontsource/nanum-gothic-coding/400.css'
import '@fontsource/nanum-gothic-coding/700.css'
import './styles/quasar.sass'
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
