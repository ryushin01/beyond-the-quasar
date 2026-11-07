import type { Category, Mission, OrbitClass, Satellite } from '../model/types'

export interface SatelliteFilter {
  query: string
  categories: Category[]
  missions: Mission[]
  orbits: OrbitClass[]
  owners: string[]
  dualUseOnly: boolean
  watchedOnly: boolean
}

export const EMPTY_FILTER: SatelliteFilter = {
  query: '',
  categories: [],
  missions: [],
  orbits: [],
  owners: [],
  dualUseOnly: false,
  watchedOnly: false,
}

const includesOrEmpty = <T>(selected: T[], value: T): boolean => selected.length === 0 || selected.includes(value)

export function filterSatellites(satellites: Satellite[], filter: SatelliteFilter, watched: readonly number[] = []): Satellite[] {
  const query = filter.query.trim().toLowerCase()
  return satellites.filter(
    (satellite) =>
      includesOrEmpty(filter.categories, satellite.category) &&
      includesOrEmpty(filter.missions, satellite.mission) &&
      includesOrEmpty(filter.orbits, satellite.orbit) &&
      includesOrEmpty(filter.owners, satellite.owner ?? '') &&
      (!filter.dualUseOnly || satellite.dualUse) &&
      (!filter.watchedOnly || watched.includes(satellite.noradId)) &&
      (query === '' ||
        satellite.name.toLowerCase().includes(query) ||
        String(satellite.noradId).includes(query) ||
        (satellite.objectId ?? '').toLowerCase().includes(query)),
  )
}

export function countBy<T extends string>(satellites: Satellite[], pick: (satellite: Satellite) => T | null): Map<T, number> {
  const counts = new Map<T, number>()
  for (const satellite of satellites) {
    const key = pick(satellite)
    if (key !== null) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
