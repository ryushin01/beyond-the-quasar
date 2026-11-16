import { describe, expect, it } from 'vitest'

import { STALE_SNAPSHOT_DAYS, staleSnapshotDays } from './freshness'

const now = new Date('2026-11-16T00:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)

describe('staleSnapshotDays', () => {
  it('아직 받지 않았으면 null', () => {
    expect(staleSnapshotDays(null, now)).toBeNull()
  })
  it(`${STALE_SNAPSHOT_DAYS}일까지는 null`, () => {
    expect(staleSnapshotDays(daysAgo(STALE_SNAPSHOT_DAYS), now)).toBeNull()
  })
  it('날수를 내림하기 전 시간으로 비교한다(10일 12시간이면 경고)', () => {
    expect(staleSnapshotDays(daysAgo(STALE_SNAPSHOT_DAYS + 0.5), now)).toBe(STALE_SNAPSHOT_DAYS)
  })
  it('기준을 넘으면 지난 날수', () => {
    expect(staleSnapshotDays(daysAgo(STALE_SNAPSHOT_DAYS + 1), now)).toBe(STALE_SNAPSHOT_DAYS + 1)
    expect(staleSnapshotDays(daysAgo(40), now)).toBe(40)
  })
})
