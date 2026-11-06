import { fileURLToPath, URL } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitest/config'

const isTest = process.env.VITEST === 'true'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: false }),
    // 테스트에서는 CSS를 검증하지 않으므로 UnoCSS 플러그인을 뺍니다.
    ...(isTest ? [] : [UnoCSS()]),
    VueI18nPlugin({
      include: fileURLToPath(new URL('./src/shared/i18n/locales/**', import.meta.url)),
      strictMessage: false,
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['gsap', 'lenis'],
          astro: ['satellite.js', 'astronomy-engine'],
          quasar: ['quasar'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    setupFiles: ['./src/shared/lib/test/setup.ts'],
    server: { deps: { inline: ['quasar'] } },
    css: false,
  },
})
