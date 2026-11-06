import { describe, expect, it } from 'vitest'

import { altitudeCurve, bodyPosition, equatorialToHorizontal, moonInfo, nightBrief, projectHorizontal, subsolarPoint } from './sky'

const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }

describe('태양 직하점', () => {
  it('춘분 정오 무렵 직하점은 적도, 그리니치 근처다', () => {
    const point = subsolarPoint(new Date('2026-03-20T12:00:00Z'))
    expect(Math.abs(point.latitude)).toBeLessThan(1)
    expect(Math.abs(point.longitude)).toBeLessThan(3)
  })

  it('하지의 직하점은 북회귀선 근처다', () => {
    expect(subsolarPoint(new Date('2026-06-21T12:00:00Z')).latitude).toBeCloseTo(23.4, 0)
  })
})

describe('달', () => {
  it('2026-08-28 보름달 무렵 조명률이 높다', () => {
    const info = moonInfo(new Date('2026-08-28T04:00:00Z'))
    expect(info.illumination).toBeGreaterThan(0.98)
    expect(info.phaseKey).toBe('full')
  })

  it('2026-08-12 일식 무렵은 삭이다', () => {
    const info = moonInfo(new Date('2026-08-12T17:00:00Z'))
    expect(info.illumination).toBeLessThan(0.02)
    expect(info.phaseKey).toBe('new')
  })
})

describe('밤 정보', () => {
  it('일몰 뒤에 천문 박명과 일출이 차례로 온다', () => {
    const brief = nightBrief(new Date('2026-11-06T00:00:00Z'), DAEJEON)
    expect(brief.sunset!.getTime()).toBeLessThan(brief.duskAstronomical!.getTime())
    expect(brief.duskAstronomical!.getTime()).toBeLessThan(brief.dawnAstronomical!.getTime())
    expect(brief.dawnAstronomical!.getTime()).toBeLessThan(brief.sunrise!.getTime())
  })
})

describe('좌표', () => {
  it('한낮의 태양은 지평선 위에 있다', () => {
    // 대전 정오 ≈ 03:30 UTC
    expect(bodyPosition('Sun', new Date('2026-11-06T03:30:00Z'), DAEJEON).altitude).toBeGreaterThan(30)
  })

  it('북극성의 고도는 관측지 위도와 비슷하다', () => {
    const polaris = equatorialToHorizontal(2.5302, 89.264, new Date('2026-11-06T12:00:00Z'), DAEJEON)
    expect(Math.abs(polaris.altitude - DAEJEON.latitude)).toBeLessThan(1.5)
  })

  it('투영: 천정은 중심, 지평선은 반지름 1, 아래는 null', () => {
    expect(projectHorizontal({ altitude: 90, azimuth: 0 })).toEqual({ x: -0, y: -0 })
    const horizon = projectHorizontal({ altitude: 0, azimuth: 90 })!
    expect(horizon.x).toBeCloseTo(-1, 5)
    expect(projectHorizontal({ altitude: -1, azimuth: 0 })).toBeNull()
  })

  it('고도 곡선의 간격과 개수가 맞다', () => {
    const curve = altitudeCurve(12, 0, DAEJEON, new Date('2026-11-06T10:00:00Z'), { hours: 2, stepMin: 30 })
    expect(curve).toHaveLength(5)
  })
})
