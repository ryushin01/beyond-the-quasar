import { config } from '@vue/test-utils'
import { Notify, Quasar } from 'quasar'

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

const { i18n } = await import('../../i18n')
i18n.global.locale.value = 'ko'
config.global.plugins = [[Quasar, { plugins: { Notify } }], i18n]
