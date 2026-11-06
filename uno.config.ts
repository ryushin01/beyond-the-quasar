import presetWind4 from '@unocss/preset-wind4'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    // 초기화 CSS는 Quasar가 담당합니다.
    presetWind4({ preflights: { reset: false } }),
  ],
  content: { pipeline: { include: [/\.(vue|ts)($|\?)/], exclude: [/\.story\.vue/, /\.test\.ts/] } },
  theme: {
    colors: {
      ink: 'var(--ink)',
      paper: 'var(--paper)',
      muted: 'var(--muted)',
      line: 'var(--line)',
      signal: 'var(--signal)',
      alert: 'var(--alert)',
      raised: 'var(--raised)',
    },
    font: {
      display: 'var(--font-display)',
      mono: 'var(--font-mono)',
    },
  },
  shortcuts: {
    'label-mono': 'font-mono text-[0.75rem] uppercase tracking-[0.08em] text-muted',
    'panel-head': 'flex items-center justify-between gap-3 px-4 py-3 border-b border-line',
  },
})
