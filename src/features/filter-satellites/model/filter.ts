import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'

import { EMPTY_FILTER, filterSatellites, useWatchlist, type Category, type Mission, type OrbitClass, type Satellite, type SatelliteFilter } from '@/entities/satellite'

function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export const useSatelliteFilter = defineStore('satellite-filter', () => {
  const filter = reactive<SatelliteFilter>({ ...EMPTY_FILTER })
  const watchlist = useWatchlist()

  const isActive = computed(
    () =>
      filter.query !== '' ||
      filter.dualUseOnly ||
      filter.watchedOnly ||
      filter.categories.length + filter.missions.length + filter.orbits.length + filter.owners.length > 0,
  )

  function toggleCategory(value: Category): void {
    filter.categories = toggled(filter.categories, value)
  }
  function toggleMission(value: Mission): void {
    filter.missions = toggled(filter.missions, value)
  }
  function toggleOrbit(value: OrbitClass): void {
    filter.orbits = toggled(filter.orbits, value)
  }
  function toggleOwner(value: string): void {
    filter.owners = toggled(filter.owners, value)
  }
  function reset(): void {
    Object.assign(filter, EMPTY_FILTER)
  }

  /** 현재 조건과 관심 위성을 적용한 목록 */
  const apply = (satellites: Satellite[]): Satellite[] => filterSatellites(satellites, filter, watchlist.ids)

  return { filter, isActive, apply, toggleCategory, toggleMission, toggleOrbit, toggleOwner, reset }
})
