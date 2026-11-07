import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/geist-mono/index.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import 'quasar/dist/quasar.prod.css'
import 'virtual:uno.css'
import '@/app/styles/global.css'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from 'cypress/vue'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar } from 'quasar'
import iconSet from 'quasar/icon-set/svg-material-symbols-sharp'

import { i18n } from '@/shared/i18n'

type MountParams = Parameters<typeof mount>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** 앱과 같은 플러그인(Pinia, i18n, Quasar, Vue Query)을 붙여 컴포넌트를 띄웁니다. */
      mount(component: MountParams[0], options?: MountParams[1]): Chainable
    }
  }
}

Cypress.Commands.add('mount', (component, options = {}) => {
  // 테스트마다 새 저장소로 시작해 앞 테스트의 필터나 시계가 남지 않게 합니다.
  const pinia = createPinia()
  setActivePinia(pinia)
  i18n.global.locale.value = 'ko'
  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [...(options.global?.plugins ?? []), pinia, i18n, VueQueryPlugin, [Quasar, { iconSet, config: { dark: true } }]],
    },
  })
})
