import {
  degreesLat,
  degreesLong,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
  type SatRec,
} from 'satellite.js'

import type { LookAngle, OrbitClass, Pass, SatelliteState } from '../model/types'

const EARTH_RADIUS_KM = 6371
const DEG = Math.PI / 180

const cache = new Map<string, SatRec>()

export function toSatrec(line1: string, line2: string): SatRec {
  const key = line2
  let satrec = cache.get(key)
  if (!satrec) {
    satrec = twoline2satrec(line1, line2)
    cache.set(key, satrec)
  }
  return satrec
}

/** 평균 운동(회/일)과 이심률로 궤도 종류를 나눕니다. */
export function classifyOrbit(line2: string): OrbitClass {
  const eccentricity = Number(`0.${line2.slice(26, 33).trim()}`)
  const meanMotion = Number(line2.slice(52, 63))
  if (eccentricity > 0.25) return 'HEO'
  if (meanMotion >= 11.25) return 'LEO'
  if (meanMotion > 0.9 && meanMotion < 1.1) return 'GEO'
  return meanMotion >= 1.1 ? 'MEO' : 'HEO'
}

/** TLE 1행의 기원(epoch)을 Date로 변환합니다. */
export function tleEpoch(line1: string): Date {
  const yy = Number(line1.slice(18, 20))
  const day = Number(line1.slice(20, 32))
  const year = yy < 57 ? 2000 + yy : 1900 + yy
  return new Date(Date.UTC(year, 0, 1) + (day - 1) * 86_400_000)
}

export function stateAt(satrec: SatRec, date: Date): SatelliteState | null {
  const result = propagate(satrec, date)
  if (!result || typeof result.position === 'boolean' || typeof result.velocity === 'boolean') return null
  const geodetic = eciToGeodetic(result.position, gstime(date))
  const { x, y, z } = result.velocity
  return {
    latitude: degreesLat(geodetic.latitude),
    longitude: degreesLong(geodetic.longitude),
    altitudeKm: geodetic.height,
    speedKmS: Math.sqrt(x * x + y * y + z * z),
  }
}

export function lookAngleAt(
  satrec: SatRec,
  date: Date,
  observer: { latitude: number; longitude: number; elevationM: number },
): LookAngle | null {
  const result = propagate(satrec, date)
  if (!result || typeof result.position === 'boolean') return null
  const gmst = gstime(date)
  const look = ecfToLookAngles(
    { latitude: observer.latitude * DEG, longitude: observer.longitude * DEG, height: observer.elevationM / 1000 } as never,
    eciToEcf(result.position, gmst) as never,
  )
  return { azimuth: look.azimuth / DEG, elevation: look.elevation / DEG, rangeKm: look.rangeSat }
}

/** 두 위성 사이의 직선 거리(km) */
export function separationKm(a: SatRec, b: SatRec, date: Date): number | null {
  const pa = propagate(a, date)?.position
  const pb = propagate(b, date)?.position
  if (!pa || !pb || typeof pa === 'boolean' || typeof pb === 'boolean') return null
  return Math.hypot(pa.x - pb.x, pa.y - pb.y, pa.z - pb.z)
}

/** date를 중심으로 앞뒤 궤적을 [경도, 위도] 목록으로 돌려줍니다. */
export function groundTrack(
  satrec: SatRec,
  date: Date,
  { pastMin, futureMin, stepSec = 45 }: { pastMin: number; futureMin: number; stepSec?: number },
): { past: [number, number][]; future: [number, number][] } {
  const collect = (fromMin: number, toMin: number): [number, number][] => {
    const points: [number, number][] = []
    for (let s = fromMin * 60; s <= toMin * 60; s += stepSec) {
      const state = stateAt(satrec, new Date(date.getTime() + s * 1000))
      if (state) points.push([state.longitude, state.latitude])
    }
    return points
  }
  return { past: collect(-pastMin, 0), future: collect(0, futureMin) }
}

/** 지표에서 위성이 보이는 범위의 각반경(도) */
export function footprintRadiusDeg(altitudeKm: number): number {
  return Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + Math.max(0, altitudeKm))) / DEG
}

/** 궤도 주기(분). TLE 2행의 평균 운동에서 구합니다. */
export function orbitalPeriodMin(line2: string): number {
  return 1440 / Number(line2.slice(52, 63))
}

/**
 * 관측지 상공 통과를 예측합니다. 정지궤도처럼 지평선을 넘지 않으면 빈 배열입니다.
 * `stepSec` 간격으로 훑은 뒤, 시작·끝은 고도각 기준을 넘는 정수 초를 이분 탐색으로, 최고 고도는 1초 단위로 다듬습니다.
 * 그래서 훑는 간격이 달라도(통과 표 30초, 일정 60초) 같은 통과는 같은 시작 시각을 얻습니다.
 * 이미 진행 중인 통과는 실제 시작 시각까지 거슬러 찾습니다(시작이 `from`보다 앞일 수 있음).
 */
export function predictPasses(
  satrec: SatRec,
  observer: { latitude: number; longitude: number; elevationM: number },
  from: Date,
  { hours = 24, minElevation = 10, stepSec = 30, limit = 6 } = {},
): Pass[] {
  const passes: Pass[] = []
  const stepMs = stepSec * 1000
  const end = from.getTime() + hours * 3_600_000
  const lookAt = (time: number) => lookAngleAt(satrec, new Date(time), observer)
  const isAbove = (second: number) => (lookAt(second * 1000)?.elevation ?? -90) >= minElevation

  /** below초는 기준 아래, above초는 기준 이상일 때 둘 사이에서 처음 기준 이상이 되는 정수 초 */
  const firstAbove = (below: number, above: number): number => {
    while (above - below > 1) {
      const mid = Math.floor((below + above) / 2)
      if (isAbove(mid)) above = mid
      else below = mid
    }
    return above
  }
  /** above초는 기준 이상, below초는 기준 아래일 때 둘 사이에서 마지막으로 기준 이상인 정수 초 */
  const lastAbove = (above: number, below: number): number => {
    while (below - above > 1) {
      const mid = Math.floor((above + below) / 2)
      if (isAbove(mid)) above = mid
      else below = mid
    }
    return above
  }
  /** [start, finish] 초 안에서 고도각이 가장 높은 정수 초(삼분 탐색) */
  const peak = (start: number, finish: number): number => {
    const elevation = (second: number) => lookAt(second * 1000)?.elevation ?? -90
    while (finish - start > 2) {
      const left = start + Math.floor((finish - start) / 3)
      const right = finish - Math.floor((finish - start) / 3)
      if (elevation(left) < elevation(right)) start = left
      else finish = right
    }
    let best = start
    for (let second = start + 1; second <= finish; second++) if (elevation(second) > elevation(best)) best = second
    return best
  }
  const toPass = (aos: number, los: number, sampledMax: number): Pass => {
    const aosLook = lookAt(aos * 1000)
    const losLook = lookAt(los * 1000)
    const maxSecond = peak(Math.max(aos, sampledMax - stepSec), Math.min(los, sampledMax + stepSec))
    return {
      aos: new Date(aos * 1000),
      los: new Date(los * 1000),
      maxAt: new Date(maxSecond * 1000),
      maxElevation: lookAt(maxSecond * 1000)?.elevation ?? minElevation,
      aosAzimuth: aosLook?.azimuth ?? 0,
      losAzimuth: losLook?.azimuth ?? 0,
    }
  }

  let aos: number | null = null
  let sampledMax = 0
  let sampledMaxElevation = -90
  let previous: number | null = null
  for (let t = from.getTime(); t <= end && passes.length < limit; t += stepMs) {
    const look = lookAt(t)
    if (!look) continue
    const second = Math.floor(t / 1000)
    const above = look.elevation >= minElevation
    if (above && aos === null) {
      if (previous === null) {
        // 첫 표본부터 위에 있으면 진행 중인 통과입니다. 기준 아래가 나올 때까지 거슬러 올라가 시작을 찾습니다(최대 2시간).
        let back = second
        while (isAbove(back) && second - back < 7200) back -= stepSec
        aos = isAbove(back) ? second : firstAbove(back, back + stepSec)
      } else {
        aos = firstAbove(previous, second)
      }
      sampledMax = second
      sampledMaxElevation = look.elevation
    } else if (above && aos !== null) {
      if (look.elevation > sampledMaxElevation) {
        sampledMax = second
        sampledMaxElevation = look.elevation
      }
    } else if (!above && aos !== null) {
      passes.push(toPass(aos, lastAbove(previous ?? second - stepSec, second), sampledMax))
      aos = null
      sampledMaxElevation = -90
    }
    previous = second
  }
  // 예측 끝에서도 위에 있으면 마지막 표본을 끝으로 둡니다.
  if (aos !== null && passes.length < limit && previous !== null) passes.push(toPass(aos, previous, sampledMax))
  return passes
}

/** 지구 반지름을 1로 둔 3D 좌표. three.js처럼 y가 북극 방향이고, x는 춘분점 방향입니다. */
export type ScenePoint = [x: number, y: number, z: number]

/** 관성 좌표(ECI, km)를 화면 좌표로 옮깁니다. 축을 바꿔도 오른손 좌표계가 유지되게 z(북)를 y로, y를 -z로 둡니다. */
function toScene({ x, y, z }: { x: number; y: number; z: number }): ScenePoint {
  return [x / EARTH_RADIUS_KM, z / EARTH_RADIUS_KM, -y / EARTH_RADIUS_KM]
}

export function scenePosition(satrec: SatRec, date: Date): ScenePoint | null {
  const result = propagate(satrec, date)
  if (!result || typeof result.position === 'boolean') return null
  return toScene(result.position)
}

/**
 * 지금부터 한 바퀴 동안의 궤도를 점으로 나눕니다. 관성 좌표라 지구 자전과 무관하게 닫힌 고리가 됩니다.
 * 주기는 TLE의 평균 운동(satrec.no, 라디안/분)으로 구합니다.
 */
export function orbitPath(satrec: SatRec, date: Date, steps = 120): ScenePoint[] {
  const periodMs = ((2 * Math.PI) / satrec.no) * 60_000
  const points: ScenePoint[] = []
  for (let step = 0; step <= steps; step++) {
    const point = scenePosition(satrec, new Date(date.getTime() + (periodMs * step) / steps))
    if (point) points.push(point)
  }
  return points
}

/** 그리니치 항성시(라디안). 지구본을 실제 자전 각도만큼 돌려 대륙 위치를 맞출 때 씁니다. */
export function earthRotation(date: Date): number {
  return gstime(date)
}
