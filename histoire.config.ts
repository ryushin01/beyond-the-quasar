import { HstVue } from '@histoire/plugin-vue'
import { defineConfig } from 'histoire'

export default defineConfig({
  plugins: [HstVue()],
  setupFile: './src/app/histoire.setup.ts',
  storyMatch: ['src/**/*.story.vue'],
  theme: { title: 'Beyond the Quasar' },
  tree: { groups: [{ title: 'shared', include: (f) => f.path.includes('/shared/') }, { title: 'entities', include: (f) => f.path.includes('/entities/') }, { title: 'features', include: (f) => f.path.includes('/features/') }, { title: 'widgets', include: (f) => f.path.includes('/widgets/') }] },
})
