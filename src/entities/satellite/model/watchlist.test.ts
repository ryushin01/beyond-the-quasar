import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { useWatchlist } from './watchlist'

describe('useWatchlist', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('토글하면 추가와 제거를 하고 저장한다', async () => {
    const store = useWatchlist()
    store.toggle(25544)
    expect(store.has(25544)).toBe(true)
    await nextTick()
    expect(JSON.parse(localStorage.getItem('btq:watchlist')!)).toEqual([25544])
    store.toggle(25544)
    expect(store.has(25544)).toBe(false)
  })

  it('저장된 값이 잘못되어도 빈 목록으로 시작한다', () => {
    localStorage.setItem('btq:watchlist', '{"bad":true}')
    expect(useWatchlist().ids).toEqual([])
  })
})
