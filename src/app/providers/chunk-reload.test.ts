import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMemoryHistory, createRouter } from 'vue-router'

import { isChunkLoadError, reloadOnChunkError, reloadOnce, sameOriginUrl } from './chunk-reload'

const here = (path: string) => new URL(path, window.location.origin).href

describe('isChunkLoadError', () => {
  it('브라우저별 조각 로드 실패 문구를 알아본다', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/index-abc.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/index.css'))).toBe(true)
  })
  it('다른 오류는 새로고침 대상이 아니다', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe('reloadOnce', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('한 번 새로고침하고, 10초 안에 다시 실패하면 그대로 둔다(무한 새로고침 방지)', () => {
    const assign = vi.fn()
    expect(reloadOnce('/control', 1_000_000, assign)).toBe(true)
    expect(assign).toHaveBeenCalledWith(here('/control'))
    expect(reloadOnce('/control', 1_005_000, assign)).toBe(false)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('막힌 시도는 시각을 남기지 않아, 마지막 새로고침에서 10초가 지나면 다시 새로고침한다', () => {
    const assign = vi.fn()
    reloadOnce('/a', 1_000_000, assign)
    reloadOnce('/a', 1_005_000, assign) // 막힘
    expect(reloadOnce('/b', 1_011_000, assign)).toBe(true)
    expect(assign).toHaveBeenLastCalledWith(here('/b'))
  })

  it('저장소를 쓸 수 없으면 반복을 막을 수 없으므로 새로고침하지 않는다', () => {
    const assign = vi.fn()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const original = globalThis.sessionStorage
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get: () => {
        throw new Error('SecurityError')
      },
    })
    try {
      expect(reloadOnce('/control', 1_000_000, assign)).toBe(false)
      expect(assign).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: original })
    }
  })
})

describe('sameOriginUrl', () => {
  const origin = 'https://beyond-the-quasar-ryushin01.vercel.app'
  it('같은 출처의 경로는 출처까지 붙인 절대 주소로(쿼리·해시 포함)', () => {
    expect(sameOriginUrl('/catalog?view=globe#x', origin)).toBe(`${origin}/catalog?view=globe#x`)
  })
  it('다른 출처로 풀리는 주소는 막는다(열린 리다이렉트 방지)', () => {
    expect(sameOriginUrl('//attacker.example/', origin)).toBeNull()
    expect(sameOriginUrl('/\\attacker.example/', origin)).toBeNull()
    expect(sameOriginUrl('https://attacker.example/', origin)).toBeNull()
  })
  it('점 경로로 풀어도 `//`로 시작하는 경로가 다른 출처로 바뀌지 않는다', () => {
    const url = sameOriginUrl('/.//attacker.example/x', origin)
    expect(url).toBe(`${origin}//attacker.example/x`)
    // 절대 주소라 브라우저가 다시 풀어도 같은 출처입니다.
    expect(new URL(url!, origin).origin).toBe(origin)
  })
})

describe('reloadOnce 목적지', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('다른 출처로 풀리는 주소로는 새로고침하지 않고 반복 방지 시각도 남기지 않는다', () => {
    const assign = vi.fn()
    expect(reloadOnce('//attacker.example/', 1_000_000, assign)).toBe(false)
    expect(assign).not.toHaveBeenCalled()
    expect(reloadOnce('/catalog', 1_001_000, assign)).toBe(true)
    expect(assign).toHaveBeenCalledWith(here('/catalog'))
  })
})

describe('reloadOnChunkError', () => {
  const chunkError = () => new TypeError('Failed to fetch dynamically imported module: /assets/index-abc.js')
  const Blank = { render: () => null }
  beforeEach(() => {
    sessionStorage.clear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('화면 조각을 받지 못하면 가려던 주소로 새로고침한다', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Blank }, { path: '/catalog', component: () => Promise.reject(chunkError()) }] })
    const assign = vi.fn()
    reloadOnChunkError(router, assign)
    await router.push('/')
    await router.push('/catalog').catch(() => {})
    expect(assign).toHaveBeenCalledWith(here('/catalog'))
  })

  it('지금 화면으로 되돌아가 버려진 이동의 조각이 실패하면 새로고침하지 않는다', async () => {
    let fail!: (error: Error) => void
    let markStarted!: () => void
    const started = new Promise<void>((resolve) => (markStarted = resolve))
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: Blank },
        {
          path: '/catalog',
          component: () => {
            markStarted()
            return new Promise((_, reject) => (fail = reject))
          },
        },
      ],
    })
    const assign = vi.fn()
    reloadOnChunkError(router, assign)
    await router.push('/')
    const abandoned = router.push('/catalog').catch(() => {})
    // 카탈로그 조각을 받기 시작한 뒤에 지금 화면(/)으로 다시 갑니다.
    await started
    await router.push('/')
    fail(chunkError())
    await abandoned
    expect(assign).not.toHaveBeenCalled()
  })
})
