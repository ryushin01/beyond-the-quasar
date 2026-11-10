import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SearchAltitude,
  SearchRiseSet,
  SiderealTime,
} from 'astronomy-engine'

export const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const
export type SkyBodyName = 'Sun' | 'Moon' | (typeof PLANETS)[number]

export interface SiteLike {
  latitude: number
  longitude: number
  elevationM: number
}

export interface HorizontalPosition {
  altitude: number
  azimuth: number
}

export const toObserver = (site: SiteLike): Observer => new Observer(site.latitude, site.longitude, site.elevationM)

/** 적경(시)·적위(도)를 지평 좌표로 변환합니다. */
export function equatorialToHorizontal(ra: number, dec: number, date: Date, site: SiteLike): HorizontalPosition {
  const horizon = Horizon(date, toObserver(site), ra, dec, 'normal')
  return { altitude: horizon.altitude, azimuth: horizon.azimuth }
}

export function bodyPosition(body: SkyBodyName, date: Date, site: SiteLike): HorizontalPosition {
  const observer = toObserver(site)
  const equator = Equator(Body[body], date, observer, true, true)
  return equatorialToHorizontal(equator.ra, equator.dec, date, site)
}

/** 지방 항성시(시). 많은 별을 한꺼번에 계산할 때 씁니다. */
export function localSiderealHours(date: Date, longitude: number): number {
  return (((SiderealTime(date) + longitude / 15) % 24) + 24) % 24
}

/** 태양 직하점(위도·경도). 낮밤 경계를 그리는 데 씁니다. */
export function subsolarPoint(date: Date): { latitude: number; longitude: number } {
  const equator = Equator(Body.Sun, date, new Observer(0, 0, 0), true, false)
  const longitude = ((((equator.ra - SiderealTime(date)) * 15 + 180) % 360) + 360) % 360 - 180
  return { latitude: equator.dec, longitude }
}

/** 달의 위상 이름 키와 조명률(0~1) */
export function moonInfo(date: Date): { phaseAngle: number; illumination: number; phaseKey: string } {
  const phaseAngle = MoonPhase(date)
  const illumination = Illumination(Body.Moon, date).phase_fraction
  const index = Math.floor(((phaseAngle + 22.5) % 360) / 45)
  const keys = ['new', 'waxingCrescent', 'firstQuarter', 'waxingGibbous', 'full', 'waningGibbous', 'lastQuarter', 'waningCrescent']
  return { phaseAngle, illumination, phaseKey: keys[index]! }
}

export interface NightBrief {
  sunset: Date | null
  sunrise: Date | null
  duskAstronomical: Date | null
  dawnAstronomical: Date | null
  moonrise: Date | null
  moonset: Date | null
}

/** date 이후 처음 오는 밤의 일몰, 천문 박명, 일출, 월출·월몰 */
export function nightBrief(date: Date, site: SiteLike): NightBrief {
  const observer = toObserver(site)
  const searchDays = 2
  const sunset = SearchRiseSet(Body.Sun, observer, -1, date, searchDays)?.date ?? null
  const start = sunset ?? date
  return {
    sunset,
    sunrise: SearchRiseSet(Body.Sun, observer, +1, start, searchDays)?.date ?? null,
    duskAstronomical: SearchAltitude(Body.Sun, observer, -1, start, searchDays, -18)?.date ?? null,
    dawnAstronomical: SearchAltitude(Body.Sun, observer, +1, start, searchDays, -18)?.date ?? null,
    moonrise: SearchRiseSet(Body.Moon, observer, +1, date, searchDays)?.date ?? null,
    moonset: SearchRiseSet(Body.Moon, observer, -1, date, searchDays)?.date ?? null,
  }
}

/** 하늘 지도용 스테레오 투영: 천정이 중심, 지평선이 반지름 1 */
export function projectHorizontal(position: HorizontalPosition): { x: number; y: number } | null {
  if (position.altitude < 0) return null
  const zenith = ((90 - position.altitude) * Math.PI) / 180
  const r = Math.tan(zenith / 2)
  const azimuth = (position.azimuth * Math.PI) / 180
  // 하늘을 올려다본 지도이므로 동쪽이 왼쪽입니다.
  return { x: -r * Math.sin(azimuth), y: -r * Math.cos(azimuth) }
}

/** 시간에 따른 고도 곡선 */
export function altitudeCurve(
  ra: number,
  dec: number,
  site: SiteLike,
  from: Date,
  { hours = 14, stepMin = 15 } = {},
): { date: Date; altitude: number }[] {
  const points: { date: Date; altitude: number }[] = []
  for (let minutes = 0; minutes <= hours * 60; minutes += stepMin) {
    const date = new Date(from.getTime() + minutes * 60_000)
    points.push({ date, altitude: equatorialToHorizontal(ra, dec, date, site).altitude })
  }
  return points
}
