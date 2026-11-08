import { describe, expect, it } from 'vitest'

import { CONSTELLATIONS } from './constellations'
import { BRIGHT_STARS } from './targets'

const points = CONSTELLATIONS.flatMap((constellation) => constellation.paths.flat())

describe('CONSTELLATIONS', () => {
  it('좌표가 적경·적위 범위 안에 있다', () => {
    for (const [ra, dec] of points) {
      expect(ra).toBeGreaterThanOrEqual(0)
      expect(ra).toBeLessThan(24)
      expect(Math.abs(dec)).toBeLessThanOrEqual(90)
    }
  })

  it('선마다 점이 두 개 이상이다', () => {
    for (const constellation of CONSTELLATIONS) {
      for (const path of constellation.paths) expect(path.length).toBeGreaterThanOrEqual(2)
    }
  })

  it.each(['Betelgeuse', 'Rigel', 'Vega', 'Altair', 'Deneb', 'Antares', 'Regulus', 'Sirius', 'Spica', 'Castor', 'Pollux'])('%s가 별자리선 위에 있다', (name) => {
    const star = BRIGHT_STARS.find((item) => item.name === name)!
    const nearest = Math.min(...points.map(([ra, dec]) => Math.hypot((ra - star.ra) * 15, dec - star.dec)))
    expect(nearest).toBeLessThan(0.1)
  })
})
