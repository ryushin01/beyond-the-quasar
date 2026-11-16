import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isChunkLoadError, reloadOnce } from './chunk-reload'

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
    expect(assign).toHaveBeenCalledWith('/control')
    expect(reloadOnce('/control', 1_005_000, assign)).toBe(false)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('막힌 시도는 시각을 남기지 않아, 마지막 새로고침에서 10초가 지나면 다시 새로고침한다', () => {
    const assign = vi.fn()
    reloadOnce('/a', 1_000_000, assign)
    reloadOnce('/a', 1_005_000, assign) // 막힘
    expect(reloadOnce('/b', 1_011_000, assign)).toBe(true)
    expect(assign).toHaveBeenLastCalledWith('/b')
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
