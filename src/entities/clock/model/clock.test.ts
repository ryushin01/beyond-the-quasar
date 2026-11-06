import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMissionClock } from './clock'

describe('useMissionClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T00:00:00Z'))
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('배속만큼 시간을 앞당긴다', () => {
    const clock = useMissionClock()
    clock.setRate(60)
    clock.start()
    vi.advanceTimersByTime(1000)
    expect(clock.now.toISOString()).toBe('2026-11-06T00:01:00.000Z')
    clock.stop()
  })

  it('일시 정지하면 시계가 멈추고 재설정하면 실시간으로 돌아간다', () => {
    const clock = useMissionClock()
    clock.start()
    clock.togglePaused()
    const frozen = clock.now.getTime()
    vi.advanceTimersByTime(5000)
    expect(Math.abs(clock.now.getTime() - frozen)).toBeLessThan(300)
    expect(clock.isLive).toBe(false)
    clock.reset()
    expect(clock.isLive).toBe(true)
    clock.stop()
  })
})
