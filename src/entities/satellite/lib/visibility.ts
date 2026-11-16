import { Body, Equator, GeoVector, Horizon, Observer } from 'astronomy-engine'
import { propagate, type SatRec } from 'satellite.js'

import type { Pass } from '../model/types'

const EARTH_RADIUS_KM = 6378.137
/** 시민 박명 끝(해 고도 -6°)보다 어두우면 밝은 위성이 맨눈에 보일 만큼 하늘이 어둡다고 봅니다. */
const DARK_SUN_ALTITUDE = -6

interface SiteLike {
  latitude: number
  longitude: number
  elevationM: number
}

/**
 * 위성이 햇빛을 받는지. 지구 그림자를 원기둥으로 근사합니다(반그림자는 무시).
 * 위성 위치(TEME)와 해 방향(J2000)의 좌표계 차이(세차 약 0.3°)는 그림자 판정에 영향이 거의 없습니다.
 */
export function isSunlit(satrec: SatRec, date: Date): boolean | null {
  const position = propagate(satrec, date)?.position
  if (!position || typeof position === 'boolean') return null
  const sun = GeoVector(Body.Sun, date, false)
  const length = Math.hypot(sun.x, sun.y, sun.z)
  const [sx, sy, sz] = [sun.x / length, sun.y / length, sun.z / length]
  const along = position.x * sx + position.y * sy + position.z * sz
  // 해 쪽 반구에 있으면 늘 햇빛을 받습니다.
  if (along > 0) return true
  const perpendicular = Math.hypot(position.x - along * sx, position.y - along * sy, position.z - along * sz)
  return perpendicular > EARTH_RADIUS_KM
}

/** 관측지의 해 고도(도) */
export function sunAltitude(site: SiteLike, date: Date): number {
  const observer = new Observer(site.latitude, site.longitude, site.elevationM)
  const equator = Equator(Body.Sun, date, observer, true, true)
  return Horizon(date, observer, equator.ra, equator.dec, 'normal').altitude
}

/**
 * 맨눈으로 보이는 통과인지. 가장 높이 뜬 순간에 위성은 햇빛을 받고 관측지는 어두워야 합니다.
 * 밝기(등급)는 위성 크기·자세에 따라 크게 달라 따지지 않으므로, '보일 수 있는' 통과입니다.
 */
export function isVisiblePass(satrec: SatRec, pass: Pass, site: SiteLike): boolean {
  return sunAltitude(site, pass.maxAt) < DARK_SUN_ALTITUDE && isSunlit(satrec, pass.maxAt) === true
}
