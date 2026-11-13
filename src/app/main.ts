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

import { createApp } from 'vue'

import App from './App.vue'
import { initMonitoring, reportError } from './monitoring'
import { installProviders } from './providers'

initMonitoring()

const app = createApp(App)
// Vue가 잡은 컴포넌트 오류는 전역으로 올라가지 않으므로 직접 보냅니다. 콘솔에도 그대로 남깁니다.
app.config.errorHandler = (error) => {
  console.error(error)
  reportError(error)
}
installProviders(app)
app.mount('#app')
