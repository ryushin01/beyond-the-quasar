import { config } from '@vue/test-utils'
import { Notify, Quasar } from 'quasar'
import { afterAll } from 'vitest'

// Node 26의 전역 localStorage가 jsdom 것을 가리므로 메모리 구현으로 통일합니다.
const memory = new Map<string, string>()
const storage: Storage = {
  get length() {
    return memory.size
  },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => [...memory.keys()][index] ?? null,
  removeItem: (key) => void memory.delete(key),
  setItem: (key, value) => void memory.set(key, String(value)),
}
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })

// jsdom에 없는 브라우저 API
window.matchMedia ||= ((query: string) => ({
  matches: false,
  media: query,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  onchange: null,
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia

globalThis.ResizeObserver ||= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// 앱의 GSAP 모듈은 matchMedia가 있으면 ScrollTrigger를 등록하고, 등록된 ScrollTrigger는 250ms마다 도는 타이머를 켭니다.
// 파일이 끝나 jsdom을 정리한 뒤 그 타이머가 돌면 requestAnimationFrame이 없어 가끔 처리되지 않은 오류가 나므로,
// 모든 파일에서 같은 상태로 등록해 두고 파일이 끝날 때 끕니다(위의 matchMedia 대체가 먼저 있어야 함).
const { ScrollTrigger } = await import('../../motion/gsap')
afterAll(() => ScrollTrigger.disable())

const { i18n } = await import('../../i18n')
i18n.global.locale.value = 'ko'
config.global.plugins = [[Quasar, { plugins: { Notify } }], i18n]
