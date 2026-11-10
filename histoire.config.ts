import { HstVue } from '@histoire/plugin-vue'
import { defineConfig } from 'histoire'

export default defineConfig({
  plugins: [HstVue()],
  setupFile: './src/app/histoire.setup.ts',
  storyMatch: ['src/**/*.story.vue'],
  theme: { title: 'Beyond the Quasar', defaultColorScheme: 'dark' },
  // 앱과 함께 /histoire/ 아래에 배포합니다. 정적 호스팅에서 새로고침해도 찾을 수 있게 해시 주소를 씁니다.
  routerMode: 'hash',
  vite: { base: process.env.HISTOIRE_BASE ?? '/' },
  tree: { groups: [{ title: 'shared', include: (f) => f.path.includes('/shared/') }, { title: 'entities', include: (f) => f.path.includes('/entities/') }, { title: 'features', include: (f) => f.path.includes('/features/') }, { title: 'widgets', include: (f) => f.path.includes('/widgets/') }, { title: 'pages', include: (f) => f.path.includes('/pages/') }] },
})
