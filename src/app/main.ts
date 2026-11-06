import '@fontsource-variable/archivo/wdth.css'
import '@fontsource-variable/geist-mono/index.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import 'quasar/dist/quasar.prod.css'
import 'virtual:uno.css'
import './styles/global.css'

import { createApp } from 'vue'

import App from './App.vue'
import { installProviders } from './providers'

const app = createApp(App)
installProviders(app)
app.mount('#app')
