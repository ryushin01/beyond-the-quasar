import { describe, expect, it } from 'vitest'

import { formatDms, formatDuration, formatLatitude, formatLongitude, formatNumber, formatUtc } from './format'

describe('format', () => {
  it('반구 기호를 붙여 위도와 경도를 표시한다', () => {
    expect(formatLatitude(36.3504)).toBe('36.350° N')
    expect(formatLatitude(-10)).toBe('10.000° S')
    expect(formatLongitude(127.5)).toBe('127.500° E')
    expect(formatLongitude(-70.25)).toBe('70.250° W')
  })

  it('도분초로 변환한다', () => {
    expect(formatDms(36.5, 'N', 'S')).toBe('36°30′00″N')
    expect(formatDms(-7.25, 'E', 'W')).toBe('007°15′00″W')
  })

  it('UTC 시각을 표시한다', () => {
    const date = new Date('2026-11-06T12:34:56Z')
    expect(formatUtc(date)).toBe('12:34:56Z')
    expect(formatUtc(date, true)).toBe('2026-11-06 12:34:56Z')
  })

  it('음수 기간은 0으로 표시한다', () => {
    expect(formatDuration(125)).toBe('02:05')
    expect(formatDuration(-3)).toBe('00:00')
  })

  it('값이 없으면 대시를 표시한다', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(1234.5, 1)).toBe('1,234.5')
  })
})
