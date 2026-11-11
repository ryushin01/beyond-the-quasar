import { Body, Equator, EquatorFromVector, GeoVector, Horizon, Observer, SearchGlobalSolarEclipse, SearchLocalSolarEclipse, SearchLunarEclipse } from 'astronomy-engine'

import type { SiteLike } from './sky'

export type EclipseId = 'lunarEclipse' | 'solarEclipse'
export type EclipseVisibility = 'visible' | 'partlyVisible' | 'notVisible'

export interface EclipseWindow {
  id: EclipseId
  /** i18n 키 `event.kinds.<kind>` */
  kind: string
  start: Date
  peak: Date
  end: Date
  /** 가려지는 면적 비율(0~1). 반영월식처럼 해당하지 않으면 null */
  obscuration: number | null
  visibility: EclipseVisibility
  /** 절정 때 해(일식) 또는 달(월식)의 고도(도) */
  peakAltitude: number
}

const DAY_MS = 86_400_000
const SAMPLE_MS = 10 * 60_000
const AU_KM = 149_597_870.7
const SUN_RADIUS_KM = 696_000
const MOON_RADIUS_KM = 1_737.4
const EARTH_RADIUS_KM = 6_378.14
/** 대기 때문에 지구 그림자가 기하학적 크기보다 조금 커 보이는 비율 */
const SHADOW_ENLARGEMENT = 1.02
const DEG = 180 / Math.PI

export const ECLIPSE_IDS: readonly EclipseId[] = ['lunarEclipse', 'solarEclipse']
export const isEclipseId = (value: unknown): value is EclipseId => typeof value === 'string' && (ECLIPSE_IDS as readonly string[]).includes(value)

const toObserver = (site: SiteLike): Observer => new Observer(site.latitude, site.longitude, site.elevationM)

function altitudeOf(body: Body, date: Date, observer: Observer): number {
  const equator = Equator(body, date, observer, true, true)
  return Horizon(date, observer, equator.ra, equator.dec, 'normal').altitude
}

function visibilityOver(body: Body, start: Date, end: Date, observer: Observer): EclipseVisibility {
  let above = 0
  let samples = 0
  for (let time = start.getTime(); time <= end.getTime(); time += SAMPLE_MS) {
    samples += 1
    if (altitudeOf(body, new Date(time), observer) > 0) above += 1
  }
  if (above === 0) return 'notVisible'
  return above === samples ? 'visible' : 'partlyVisible'
}

function lunarWindow(hint: Date, site: SiteLike): EclipseWindow | null {
  const info = SearchLunarEclipse(new Date(hint.getTime() - DAY_MS))
  const peak = info.peak.date
  if (Math.abs(peak.getTime() - hint.getTime()) > DAY_MS) return null
  const half = info.sd_penum * 60_000
  const start = new Date(peak.getTime() - half)
  const end = new Date(peak.getTime() + half)
  const observer = toObserver(site)
  return {
    id: 'lunarEclipse',
    kind: info.kind,
    start,
    peak,
    end,
    obscuration: info.kind === 'penumbral' ? null : info.obscuration,
    visibility: visibilityOver(Body.Moon, start, end, observer),
    peakAltitude: altitudeOf(Body.Moon, peak, observer),
  }
}

function solarWindow(hint: Date, site: SiteLike): EclipseWindow | null {
  const from = new Date(hint.getTime() - DAY_MS)
  const global = SearchGlobalSolarEclipse(from)
  if (Math.abs(global.peak.date.getTime() - hint.getTime()) > DAY_MS) return null
  const observer = toObserver(site)
  const local = SearchLocalSolarEclipse(from, observer)
  // 이 관측지에서 다음으로 보이는 일식이 다른 날이면, 이번 일식은 여기서 보이지 않습니다.
  if (Math.abs(local.peak.time.date.getTime() - global.peak.date.getTime()) > DAY_MS) {
    const peak = global.peak.date
    return {
      id: 'solarEclipse',
      kind: global.kind,
      start: new Date(peak.getTime() - 3 * 3_600_000),
      peak,
      end: new Date(peak.getTime() + 3 * 3_600_000),
      obscuration: null,
      visibility: 'notVisible',
      peakAltitude: altitudeOf(Body.Sun, peak, observer),
    }
  }
  const altitudes = [local.partial_begin.altitude, local.peak.altitude, local.partial_end.altitude]
  const above = altitudes.filter((altitude) => altitude > 0).length
  return {
    id: 'solarEclipse',
    kind: local.kind,
    start: local.partial_begin.time.date,
    peak: local.peak.time.date,
    end: local.partial_end.time.date,
    obscuration: local.obscuration,
    visibility: above === 0 ? 'notVisible' : above === altitudes.length ? 'visible' : 'partlyVisible',
    peakAltitude: local.peak.altitude,
  }
}

/** 이벤트 절정 시각 근처의 일식·월식을 관측지 기준으로 구합니다. 근처에 없으면 null입니다. */
export function eclipseWindow(id: EclipseId, hint: Date, site: SiteLike): EclipseWindow | null {
  return id === 'lunarEclipse' ? lunarWindow(hint, site) : solarWindow(hint, site)
}

export interface EyepieceDisk {
  /** 시야 중심에서의 오프셋(도). x는 동쪽이 왼쪽, y는 북쪽이 위 */
  x: number
  y: number
  radius: number
}

export interface EyepieceScene {
  /** 망원경이 따라가는 천체: 일식은 해, 월식은 달 */
  tracked: EyepieceDisk
  /** 일식에서 해를 가리는 달 */
  occluder: EyepieceDisk | null
  /** 월식에서 달에 드리우는 지구의 본그림자·반그림자 */
  umbra: EyepieceDisk | null
  penumbra: EyepieceDisk | null
  /** 따라가는 천체의 고도(도) */
  altitude: number
}

function offsetOf(ra: number, dec: number, centerRa: number, centerDec: number): { x: number; y: number } {
  let deltaRa = (ra - centerRa) * 15
  if (deltaRa > 180) deltaRa -= 360
  if (deltaRa < -180) deltaRa += 360
  // 하늘을 올려다보므로 동쪽(적경이 큰 쪽)이 왼쪽입니다.
  return { x: -deltaRa * Math.cos(centerDec / DEG), y: dec - centerDec }
}

/** 접안렌즈 시야에 놓일 원판들을 계산합니다. 작은 각도라 평면으로 근사합니다. */
export function eyepieceScene(id: EclipseId, date: Date, site: SiteLike): EyepieceScene {
  const observer = toObserver(site)
  if (id === 'solarEclipse') {
    const sun = Equator(Body.Sun, date, observer, true, true)
    const moon = Equator(Body.Moon, date, observer, true, true)
    const moonOffset = offsetOf(moon.ra, moon.dec, sun.ra, sun.dec)
    return {
      tracked: { x: 0, y: 0, radius: Math.atan(SUN_RADIUS_KM / (sun.dist * AU_KM)) * DEG },
      occluder: { ...moonOffset, radius: Math.atan(MOON_RADIUS_KM / (moon.dist * AU_KM)) * DEG },
      umbra: null,
      penumbra: null,
      altitude: Horizon(date, observer, sun.ra, sun.dec, 'normal').altitude,
    }
  }
  // 지구 그림자는 지구 중심 기준입니다. Observer(0, 0, 0)은 적도 위 한 지점이라 달에서 1°가량 시차가 생기므로 지구 중심 벡터를 씁니다.
  const sun = EquatorFromVector(GeoVector(Body.Sun, date, false))
  const moon = EquatorFromVector(GeoVector(Body.Moon, date, false))
  const shadowRa = (sun.ra + 12) % 24
  const moonKm = moon.dist * AU_KM
  const sunKm = sun.dist * AU_KM
  const moonParallax = Math.asin(EARTH_RADIUS_KM / moonKm) * DEG
  const sunParallax = Math.asin(EARTH_RADIUS_KM / sunKm) * DEG
  const sunRadius = Math.atan(SUN_RADIUS_KM / sunKm) * DEG
  const shadow = offsetOf(shadowRa, -sun.dec, moon.ra, moon.dec)
  const local = Equator(Body.Moon, date, observer, true, true)
  return {
    tracked: { x: 0, y: 0, radius: Math.atan(MOON_RADIUS_KM / moonKm) * DEG },
    occluder: null,
    umbra: { ...shadow, radius: SHADOW_ENLARGEMENT * (moonParallax + sunParallax - sunRadius) },
    penumbra: { ...shadow, radius: SHADOW_ENLARGEMENT * (moonParallax + sunParallax + sunRadius) },
    altitude: Horizon(date, observer, local.ra, local.dec, 'normal').altitude,
  }
}
