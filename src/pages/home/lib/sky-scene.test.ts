import { describe, expect, it } from 'vitest'

import { CONSTELLATIONS, PLANETS } from '@/entities/sky'

import { placeSky } from './sky-scene'

const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const SYDNEY = { latitude: -33.87, longitude: 151.21, elevationM: 40 }
const DATE = new Date('2026-11-20T12:00:00Z')

describe('placeSky', () => {
  it('별자리를 모두 놓고, 점의 절반 넘게 지평선 위에 있는 별자리만 보인다고 한다', () => {
    const sky = placeSky(DATE, DAEJEON)
    expect(sky.constellations).toHaveLength(CONSTELLATIONS.length)
    const expected = sky.constellations
      .filter((item) => {
        const points = item.paths.flat()
        return points.filter((point) => point.altitude > 0).length > points.length / 2
      })
      .map((item) => item.name)
    expect(sky.visibleNames).toEqual(expected)
    expect(sky.visibleNames.length).toBeGreaterThan(0)
    expect(sky.visibleNames.length).toBeLessThan(CONSTELLATIONS.length)
  })

  it('이름표를 다는 별은 2.1등급보다 밝은 별이고, 달과 행성을 함께 놓는다', () => {
    const sky = placeSky(DATE, DAEJEON)
    expect(sky.stars.length).toBeGreaterThan(0)
    expect(sky.stars.every((star) => star.magnitude < 2.1)).toBe(true)
    expect(sky.bodies.map((body) => body.name)).toEqual(['Moon', ...PLANETS])
    expect(sky.field).toHaveLength(1100)
  })

  it('같은 시각이라도 남반구에서는 다른 별자리가 보인다', () => {
    expect(placeSky(DATE, SYDNEY).visibleNames).not.toEqual(placeSky(DATE, DAEJEON).visibleNames)
  })

  it('같은 시각·관측지면 늘 같은 하늘이다', () => {
    expect(placeSky(DATE, DAEJEON)).toEqual(placeSky(DATE, DAEJEON))
  })
})
