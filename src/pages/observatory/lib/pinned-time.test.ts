import { describe, expect, it } from 'vitest'

import { parsePinnedTime } from './pinned-time'

describe('parsePinnedTime', () => {
  it('UTC ISO 시각을 받는다', () => {
    expect(parsePinnedTime('2026-11-24T14:54:04.000Z')?.toISOString()).toBe('2026-11-24T14:54:04.000Z')
    expect(parsePinnedTime('2027-02-06T15:59Z')?.toISOString()).toBe('2027-02-06T15:59:00.000Z')
  })

  it('여러 값이면 첫 값을 쓴다', () => {
    expect(parsePinnedTime(['2026-12-21T20:50:22Z', 'x'])?.getUTCDate()).toBe(21)
  })

  it.each([undefined, '', 'tomorrow', '2026-11-24', '2026-11-24T14:54:04+09:00', '2026-13-40T00:00Z', '2026-02-30T00:00Z', '2026-04-31T12:00Z', '2026-11-24T25:00Z', '1800-01-01T00:00Z', '2200-01-01T00:00Z', 42])('%s는 받지 않는다', (value) => {
    expect(parsePinnedTime(value)).toBeNull()
  })
})
