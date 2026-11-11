import { describe, expect, it } from 'vitest'

import { eclipseWindow, eyepieceScene, isEclipseId } from './eclipse'

const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const ATACAMA = { latitude: -24.63, longitude: -70.4, elevationM: 2635 }
const SOLAR_PEAK = new Date('2027-02-06T15:59:32Z')
const LUNAR_PEAK = new Date('2027-02-20T23:12:44Z')
const separation = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y)

describe('eclipseWindow', () => {
  it('2027년 2월 금환일식은 아타카마에서 보이고 대전에서는 보이지 않는다', () => {
    const atacama = eclipseWindow('solarEclipse', SOLAR_PEAK, ATACAMA)!
    expect(atacama.visibility).not.toBe('notVisible')
    expect(atacama.start.getTime()).toBeLessThan(atacama.peak.getTime())
    expect(atacama.end.getTime()).toBeGreaterThan(atacama.peak.getTime())
    expect(atacama.obscuration).toBeGreaterThan(0.3)
    expect(eclipseWindow('solarEclipse', SOLAR_PEAK, DAEJEON)!.visibility).toBe('notVisible')
  })

  it('반영월식의 시작과 끝은 절정을 사이에 두고 몇 시간 이어진다', () => {
    const lunar = eclipseWindow('lunarEclipse', LUNAR_PEAK, DAEJEON)!
    expect(lunar.kind).toBe('penumbral')
    expect(lunar.obscuration).toBeNull()
    const hours = (lunar.end.getTime() - lunar.start.getTime()) / 3_600_000
    expect(hours).toBeGreaterThan(2)
    expect(hours).toBeLessThan(6)
  })

  it('근처에 일식·월식이 없으면 null이다', () => {
    expect(eclipseWindow('lunarEclipse', new Date('2026-11-24T14:54:04Z'), DAEJEON)).toBeNull()
  })

  it('허용한 이름만 받는다', () => {
    expect(isEclipseId('solarEclipse')).toBe(true)
    expect(isEclipseId('fullMoon')).toBe(false)
  })
})

describe('eyepieceScene', () => {
  it('2028년 12월 31일 개기월식 절정에는 달 전체가 본그림자 안에 들어간다', () => {
    const window = eclipseWindow('lunarEclipse', new Date('2028-12-31T16:52:00Z'), DAEJEON)!
    expect(window.kind).toBe('total')
    const scene = eyepieceScene('lunarEclipse', window.peak, DAEJEON)
    expect(separation(scene.tracked, scene.umbra!) + scene.tracked.radius).toBeLessThan(scene.umbra!.radius)
  })

  it('월식이 시작할 때는 달이 반그림자 가장자리에 닿아 있다', () => {
    const window = eclipseWindow('lunarEclipse', new Date('2028-12-31T16:52:00Z'), DAEJEON)!
    const scene = eyepieceScene('lunarEclipse', window.start, DAEJEON)
    expect(separation(scene.tracked, scene.penumbra!)).toBeCloseTo(scene.penumbra!.radius + scene.tracked.radius, 1)
  })

  it('일식 절정에는 달이 해의 원판과 겹친다', () => {
    const window = eclipseWindow('solarEclipse', SOLAR_PEAK, ATACAMA)!
    const scene = eyepieceScene('solarEclipse', window.peak, ATACAMA)
    expect(scene.tracked.radius).toBeCloseTo(0.27, 1)
    expect(separation(scene.tracked, scene.occluder!)).toBeLessThan(scene.tracked.radius)
    // 금환식이므로 달이 해보다 작아 보입니다.
    expect(scene.occluder!.radius).toBeLessThan(scene.tracked.radius)
  })

  it('일식 세 시간 전에는 달이 해에서 떨어져 있다', () => {
    const scene = eyepieceScene('solarEclipse', new Date(SOLAR_PEAK.getTime() - 3 * 3_600_000), ATACAMA)
    expect(separation(scene.tracked, scene.occluder!)).toBeGreaterThan(scene.tracked.radius + scene.occluder!.radius)
  })

  it('반영월식 절정에는 달이 반그림자 안에 있고 본그림자에는 닿지 않는다', () => {
    const scene = eyepieceScene('lunarEclipse', LUNAR_PEAK, DAEJEON)
    const distance = separation(scene.tracked, scene.umbra!)
    expect(distance).toBeLessThan(scene.penumbra!.radius + scene.tracked.radius)
    expect(distance).toBeGreaterThan(scene.umbra!.radius - scene.tracked.radius)
    expect(scene.umbra!.radius).toBeGreaterThan(0.6)
    expect(scene.umbra!.radius).toBeLessThan(0.8)
  })
})
