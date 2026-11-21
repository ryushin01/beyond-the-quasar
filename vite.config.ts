import { fileURLToPath, URL } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const isTest = process.env.VITEST === 'true'

// satellite.js 7은 하나뿐인 진입점에서 WASM 일괄 계산 모듈(워커·top-level await)까지 함께 내보냅니다.
// 이 앱은 propagate 같은 JS 함수만 쓰므로 그 모듈을 빈 모듈로 바꿉니다. 그대로 두면 빌드가 워커를 iife로 묶다 실패하고,
// 쓰지 않는 Emscripten 로더가 번들에 들어갑니다.
function satelliteJsWithoutWasm(): Plugin {
  const stubId = '\0satellite-js-without-wasm'
  return {
    name: 'satellite-js-without-wasm',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './wasm/index.js' && importer && /[\\/]satellite\.js[\\/]dist[\\/]index\.js$/.test(importer)) return stubId
      return null
    },
    load(id) {
      return id === stubId ? 'export {}' : null
    },
  }
}

export default defineConfig({
  plugins: [
    satelliteJsWithoutWasm(),
    vue({ template: { transformAssetUrls } }),
    quasar({ sassVariables: false }),
    // 테스트에서는 CSS를 검증하지 않으므로 UnoCSS 플러그인을 뺍니다.
    ...(isTest ? [] : [UnoCSS()]),
    VueI18nPlugin({
      include: fileURLToPath(new URL('./src/shared/i18n/locales/**', import.meta.url)),
      strictMessage: false,
      // 메시지는 빌드 때 미리 컴파일하므로 런타임 컴파일러(약 17 kB)를 빼고, 쓰지 않는 전역 컴포넌트(i18n-t 등)·v-t도 설치하지 않습니다.
      dropMessageCompiler: true,
      fullInstall: false,
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173 },
  // 개발 서버의 의존성 미리 묶기(esbuild)는 위 플러그인을 거치지 않으므로, ESM 전용인 satellite.js는 미리 묶지 않고 그대로 받습니다.
  optimizeDeps: { exclude: ['satellite.js'] },
  build: {
    chunkSizeWarningLimit: 900,
    // 글꼴은 글자 묶음별 조각이라 필요한 것만 받아야 합니다. 작은 조각을 data: 주소로 CSS에 넣으면 모든 조각을 한꺼번에 받게 되므로 항상 파일로 내보냅니다.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
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
    // 파일마다 격리는 유지하면서 jsdom 환경을 작업자마다 한 번만 만듭니다.
    pool: 'vmThreads',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    setupFiles: ['./src/shared/lib/test/setup.ts'],
    server: { deps: { inline: ['quasar'] } },
    css: false,
  },
})
