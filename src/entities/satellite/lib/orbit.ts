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

/** 관측지 상공 통과를 예측합니다. 정지궤도처럼 지평선을 넘지 않으면 빈 배열입니다. */
export function predictPasses(
  satrec: SatRec,
  observer: { latitude: number; longitude: number; elevationM: number },
  from: Date,
  { hours = 24, minElevation = 10, stepSec = 30, limit = 6 } = {},
): Pass[] {
  const passes: Pass[] = []
  const end = from.getTime() + hours * 3_600_000
  let current: Pass | null = null

  for (let t = from.getTime(); t <= end && passes.length < limit; t += stepSec * 1000) {
    const date = new Date(t)
    const look = lookAngleAt(satrec, date, observer)
    if (!look) continue
    const above = look.elevation >= minElevation
    if (above && !current) {
      current = { aos: date, los: date, maxElevation: look.elevation, maxAt: date, aosAzimuth: look.azimuth, losAzimuth: look.azimuth }
    } else if (above && current) {
      current.los = date
      current.losAzimuth = look.azimuth
      if (look.elevation > current.maxElevation) {
        current.maxElevation = look.elevation
        current.maxAt = date
      }
    } else if (!above && current) {
      passes.push(current)
      current = null
    }
  }
  if (current && passes.length < limit) passes.push(current)
  return passes
}
