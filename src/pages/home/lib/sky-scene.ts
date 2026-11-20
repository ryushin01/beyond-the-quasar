import { bodyPosition, BRIGHT_STARS, CONSTELLATIONS, localSiderealHours, PLANETS, type SkyBodyName } from '@/entities/sky'

import { createFieldStars, toAltAz, type AltAz } from './sky-view'

export interface PlacedConstellation {
  name: string
  paths: AltAz[][]
}

/** 그 시각 그 관측지에서 본 하늘. 캔버스에 그릴 때 그대로 씁니다. */
export interface SkyScene {
  constellations: PlacedConstellation[]
  /** 이름표를 다는 밝은 별 */
  stars: (AltAz & { name: string; magnitude: number })[]
  /** 배경에 흩뿌리는 별 */
  field: (AltAz & { size: number; phase: number })[]
  /** 달과 행성 */
  bodies: (AltAz & { name: SkyBodyName })[]
  /** 별자리 점의 절반 넘게 지평선 위에 있는 별자리 */
  visibleNames: string[]
}

type Site = Parameters<typeof bodyPosition>[2]

const FIELD_STARS = createFieldStars(1100)
const LABELLED_MAGNITUDE = 2.1

export const EMPTY_SKY: SkyScene = { constellations: [], stars: [], field: [], bodies: [], visibleNames: [] }

export function placeSky(date: Date, site: Site): SkyScene {
  const sidereal = localSiderealHours(date, site.longitude)
  const place = (ra: number, dec: number): AltAz => toAltAz(ra, dec, sidereal, site.latitude)
  const constellations = CONSTELLATIONS.map((item) => ({ name: item.name, paths: item.paths.map((path) => path.map(([ra, dec]) => place(ra, dec))) }))
  return {
    constellations,
    stars: BRIGHT_STARS.filter((star) => star.magnitude < LABELLED_MAGNITUDE).map((star) => ({ ...place(star.ra, star.dec), name: star.name, magnitude: star.magnitude })),
    field: FIELD_STARS.map((star) => ({ ...place(star.ra, star.dec), size: star.size, phase: star.phase })),
    bodies: (['Moon', ...PLANETS] as SkyBodyName[]).map((name) => ({ ...bodyPosition(name, date, site), name })),
    visibleNames: constellations
      .filter((item) => {
        const points = item.paths.flat()
        return points.filter((point) => point.altitude > 0).length > points.length / 2
      })
      .map((item) => item.name),
  }
}
