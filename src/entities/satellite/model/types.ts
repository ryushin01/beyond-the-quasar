export const CATEGORIES = [
  'military',
  'navigation',
  'earth-observation',
  'weather',
  'communications',
  'science',
  'crewed',
] as const
export type Category = (typeof CATEGORIES)[number]

export const MISSIONS = [
  'milsatcom',
  'missile-warning',
  'isr',
  'ssa',
  'pnt',
  'weather',
  'imaging',
  'satcom',
  'science',
  'crewed',
  'unspecified',
] as const
export type Mission = (typeof MISSIONS)[number]

export const ORBITS = ['LEO', 'MEO', 'GEO', 'HEO'] as const
export type OrbitClass = (typeof ORBITS)[number]

export interface SatelliteRecord {
  noradId: number
  name: string
  line1: string
  line2: string
  category: Category
  mission: Mission
  dualUse: boolean
  objectId: string | null
  owner: string | null
  launchDate: string | null
  launchSite: string | null
  opsStatus: string | null
  apogeeKm: number | null
  perigeeKm: number | null
  periodMin: number | null
  inclinationDeg: number | null
  rcsM2: number | null
}

export interface Snapshot {
  fetchedAt: string
  source: string
  satellites: SatelliteRecord[]
}

export interface Satellite extends SatelliteRecord {
  orbit: OrbitClass
  epoch: Date
}

export interface SatelliteState {
  latitude: number
  longitude: number
  altitudeKm: number
  speedKmS: number
}

export interface LookAngle {
  azimuth: number
  elevation: number
  rangeKm: number
}

export interface Pass {
  aos: Date
  los: Date
  maxElevation: number
  maxAt: Date
  aosAzimuth: number
  losAzimuth: number
}
