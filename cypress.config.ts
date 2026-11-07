import { defineConfig } from 'cypress'

// 컴포넌트 테스트만 씁니다. 화면 흐름(E2E)은 Playwright가 맡고, Cypress는 jsdom이 그리지 못하는
// 캔버스·WebGL 컴포넌트를 실제 브라우저에서 띄워 확인합니다.
export default defineConfig({
  component: {
    devServer: { framework: 'vue', bundler: 'vite' },
    specPattern: 'src/**/*.cy.ts',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
    viewportWidth: 1100,
    viewportHeight: 760,
    video: false,
  },
})
