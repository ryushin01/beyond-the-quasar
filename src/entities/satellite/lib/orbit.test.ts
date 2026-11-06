import { describe, expect, it } from 'vitest'

import { classifyOrbit, footprintRadiusDeg, groundTrack, lookAngleAt, orbitalPeriodMin, predictPasses, stateAt, tleEpoch, toSatrec } from './orbit'

// ISS, 고정된 예시 TLE
const LINE1 = '1 25544U 98067A   26309.50000000  .00016717  00000+0  10270-3 0  9990'
const LINE2 = '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.49000000 10000'
const GEO2 = '2 43823   0.0100  90.0000 0001000 100.0000 200.0000  1.00270000 10000'
const GPS2 = '2 28874  55.0000  90.0000 0100000 100.0000 200.0000  2.00560000 10000'
const HEO2 = '2 99999  63.4000  90.0000 7000000 270.0000  10.0000  2.00600000 10000'

const EPOCH = new Date('2026-11-05T12:00:00Z')
const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }

describe('궤도 분류', () => {
  it('평균 운동과 이심률로 궤도를 나눈다', () => {
    expect(classifyOrbit(LINE2)).toBe('LEO')
    expect(classifyOrbit(GEO2)).toBe('GEO')
    expect(classifyOrbit(GPS2)).toBe('MEO')
    expect(classifyOrbit(HEO2)).toBe('HEO')
  })
})

describe('TLE 해석', () => {
  it('기원을 날짜로 변환한다', () => {
    expect(tleEpoch(LINE1).toISOString()).toBe('2026-11-05T12:00:00.000Z')
  })

  it('주기를 계산한다', () => {
    expect(orbitalPeriodMin(LINE2)).toBeCloseTo(92.96, 1)
  })
})

describe('전파', () => {
  const satrec = toSatrec(LINE1, LINE2)

  it('ISS의 고도와 속도가 물리적으로 맞다', () => {
    const state = stateAt(satrec, EPOCH)!
    expect(state.altitudeKm).toBeGreaterThan(380)
    expect(state.altitudeKm).toBeLessThan(450)
    expect(state.speedKmS).toBeGreaterThan(7.5)
    expect(state.speedKmS).toBeLessThan(7.8)
    expect(Math.abs(state.latitude)).toBeLessThanOrEqual(51.7)
  })

  it('궤적은 과거와 미래를 현재 위치에서 잇는다', () => {
    const track = groundTrack(satrec, EPOCH, { pastMin: 10, futureMin: 10, stepSec: 60 })
    expect(track.past).toHaveLength(11)
    expect(track.future).toHaveLength(11)
    expect(track.past.at(-1)).toEqual(track.future[0])
  })

  it('가시 범위 각반경을 계산한다', () => {
    expect(footprintRadiusDeg(420)).toBeCloseTo(20.2, 0)
    expect(footprintRadiusDeg(0)).toBe(0)
  })
})

describe('통과 예측', () => {
  const satrec = toSatrec(LINE1, LINE2)

  it('통과는 시간순이고 최고 고도는 기준 이상이다', () => {
    const passes = predictPasses(satrec, DAEJEON, EPOCH, { hours: 24, minElevation: 10, stepSec: 30 })
    expect(passes.length).toBeGreaterThan(0)
    for (const pass of passes) {
      expect(pass.los.getTime()).toBeGreaterThanOrEqual(pass.aos.getTime())
      expect(pass.maxElevation).toBeGreaterThanOrEqual(10)
      const look = lookAngleAt(satrec, pass.maxAt, DAEJEON)!
      expect(look.elevation).toBeCloseTo(pass.maxElevation, 5)
    }
  })

  it('기준 고도를 넘지 못하면 비어 있다', () => {
    expect(predictPasses(satrec, DAEJEON, EPOCH, { hours: 3, minElevation: 89.9 })).toEqual([])
  })
})
