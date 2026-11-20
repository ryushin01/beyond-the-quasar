import type { GeoPermissibleObjects } from 'd3-geo'

import { groundTrack, orbitalPeriodMin, toSatrec, type Satellite } from '@/entities/satellite'

export interface TrackGeometry {
  past: GeoPermissibleObjects
  future: GeoPermissibleObjects
}

/** 추적 위성의 지난 궤적(주기의 0.4)과 앞으로의 궤적(한 주기). 같은 위성은 15초 동안 다시 계산하지 않습니다. */
export function createTrackGeometry() {
  let cache: (TrackGeometry & { key: string }) | null = null

  return {
    at(satellite: Satellite, now: Date): TrackGeometry {
      const key = `${satellite.noradId}:${Math.floor(now.getTime() / 15_000)}`
      if (cache?.key === key) return cache
      const period = orbitalPeriodMin(satellite.line2)
      const track = groundTrack(toSatrec(satellite.line1, satellite.line2), now, {
        pastMin: period * 0.4,
        futureMin: period,
        stepSec: Math.max(20, (period * 60) / 150),
      })
      cache = {
        key,
        past: { type: 'LineString', coordinates: track.past },
        future: { type: 'LineString', coordinates: track.future },
      }
      return cache
    },
    clear(): void {
      cache = null
    },
  }
}
