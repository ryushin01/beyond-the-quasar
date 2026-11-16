import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useObservationLog } from './log'

describe('useObservationLog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('기록을 더하고 지운다', () => {
    const log = useObservationLog()
    log.add({ targetName: 'M42', siteId: 'daejeon', seeing: 3, note: '' })
    expect(log.entries).toHaveLength(1)
    log.remove(log.entries[0]!.id)
    expect(log.entries).toHaveLength(0)
  })

  it('저장된 기록이 깨졌거나 이전 형식이면 그 줄만 버린다', () => {
    const good = { id: 'a', targetName: 'M42', siteId: 'daejeon', seeing: 3, note: '맑음', loggedAt: '2026-11-16T12:00:00.000Z' }
    localStorage.setItem('btq:observation-log', JSON.stringify([good, { id: 'b', targetName: 'M31' }, 42]))
    expect(useObservationLog().entries).toEqual([good])
  })

  it('저장된 값이 배열이 아니면 빈 기록으로 시작하고, 더해도 깨지지 않는다', () => {
    localStorage.setItem('btq:observation-log', '"oops"')
    const log = useObservationLog()
    expect(log.entries).toEqual([])
    expect(() => log.add({ targetName: 'M42', siteId: 'daejeon', seeing: 3, note: '' })).not.toThrow()
  })
})
