import { describe, expect, it } from 'vitest'

import { equatorialToHorizontal, localSiderealHours } from '@/entities/sky'

import { busiestHeading, compassOf, createFieldStars, normalizeAzimuth, projectToView, toAltAz } from './sky-view'

const SITE = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const FRAME = { width: 1440, height: 900, heading: 180 }

describe('toAltAz', () => {
  it('정밀 계산과 1도 안쪽으로 맞는다', () => {
    const date = new Date('2026-11-08T15:00:00Z')
    const lst = localSiderealHours(date, SITE.longitude)
    for (const [ra, dec] of [[5.919, 7.407], [18.616, 38.784], [12.4853, 2.052]] as const) {
      const fast = toAltAz(ra, dec, lst, SITE.latitude)
      const exact = equatorialToHorizontal(ra, dec, date, SITE)
      if (exact.altitude < 10) continue
      expect(Math.abs(fast.altitude - exact.altitude)).toBeLessThan(1)
    }
  })
})

describe('projectToView', () => {
  it('바라보는 방향의 고도 40도가 화면 가로 중앙에 온다', () => {
    const point = projectToView({ altitude: 40, azimuth: 180 }, FRAME)!
    expect(point.x).toBeCloseTo(720)
    expect(point.y).toBeCloseTo(900 * 0.42)
  })

  it('방위가 커지면 오른쪽으로, 고도가 높아지면 위로 간다', () => {
    const center = projectToView({ altitude: 40, azimuth: 180 }, FRAME)!
    expect(projectToView({ altitude: 40, azimuth: 200 }, FRAME)!.x).toBeGreaterThan(center.x)
    expect(projectToView({ altitude: 60, azimuth: 180 }, FRAME)!.y).toBeLessThan(center.y)
  })

  it('등 뒤의 점은 그리지 않는다', () => {
    expect(projectToView({ altitude: -40, azimuth: 0 }, FRAME)).toBeNull()
  })
})

describe('busiestHeading', () => {
  it('지평선 위 점이 몰린 방위를 고른다', () => {
    const points = [
      ...Array.from({ length: 10 }, () => ({ altitude: 40, azimuth: 100 })),
      { altitude: 40, azimuth: 300 },
      ...Array.from({ length: 30 }, () => ({ altitude: 5, azimuth: 200 })),
    ]
    expect(busiestHeading(points)).toBe(105)
  })
})

describe('보조 함수', () => {
  it('방위를 0~360으로 맞추고 네 방위로 줄인다', () => {
    expect(normalizeAzimuth(-10)).toBe(350)
    expect(compassOf(359)).toBe('north')
    expect(compassOf(178)).toBe('south')
  })

  it('배경 별은 같은 순서로 다시 만들어진다', () => {
    expect(createFieldStars(5)).toEqual(createFieldStars(5))
  })
})
