import { describe, expect, it } from 'vitest'

import { estimateDiameterM, toCloseApproach, toLunarDistances, upcomingApproaches, type CloseApproach } from './approach'

const at = (iso: string, designation: string): CloseApproach => ({ designation, name: designation, date: new Date(iso), distanceAu: 0.01, velocityKmS: 5, absoluteMagnitude: 27 })

describe('근지구 소행성 접근', () => {
  it('천문단위를 달 거리(LD) 배수로 바꾼다', () => {
    expect(toLunarDistances(0.00257)).toBeCloseTo(1, 1)
    expect(toLunarDistances(0.05)).toBeCloseTo(19.46, 1)
  })

  it('절대 등급으로 지름 범위를 어림한다(H 22 ≈ 100~300 m, H 27 ≈ 10~25 m)', () => {
    const big = estimateDiameterM(22)
    expect(big.min).toBeGreaterThan(90)
    expect(big.max).toBeLessThan(300)
    const small = estimateDiameterM(27)
    expect(small.min).toBeCloseTo(10.6, 0)
    expect(small.max).toBeCloseTo(23.7, 0)
  })

  it('지금 이후의 접근만 날짜순으로 고른다', () => {
    const list = [at('2026-11-20T00:00:00Z', 'C'), at('2026-11-10T00:00:00Z', 'past'), at('2026-11-17T00:00:00Z', 'A')]
    expect(upcomingApproaches(list, new Date('2026-11-16T00:00:00Z')).map((item) => item.designation)).toEqual(['A', 'C'])
    expect(upcomingApproaches(list, new Date('2026-11-16T00:00:00Z'), 1)).toHaveLength(1)
  })

  it('스냅샷의 깨진 줄은 버린다', () => {
    expect(toCloseApproach({ designation: '2026 VW15', name: '(2026 VW15)', date: '2026-11-16T05:25:55.000Z', distanceAu: 0.013, velocityKmS: 6.06, absoluteMagnitude: 27.07 })).not.toBeNull()
    expect(toCloseApproach({ designation: 'x', date: 'not a date', distanceAu: 0.01, velocityKmS: 5 })).toBeNull()
    expect(toCloseApproach({ designation: 'x', date: '2026-11-16T00:00:00Z', distanceAu: '0.01', velocityKmS: 5 })).toBeNull()
    expect(toCloseApproach(null)).toBeNull()
  })
})
