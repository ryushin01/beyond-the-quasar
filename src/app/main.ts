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

// 웹 글꼴 선언(styles/fonts.css, CSS 118 kB gzip)은 첫 화면을 막지 않게 그린 뒤 따로 받습니다.
void import('./styles/fonts.css')
