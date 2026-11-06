import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'

import { EMPTY_FILTER, type Category, type Mission, type OrbitClass, type SatelliteFilter } from '@/entities/satellite'

function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export const useSatelliteFilter = defineStore('satellite-filter', () => {
  const filter = reactive<SatelliteFilter>({ ...EMPTY_FILTER })

  const isActive = computed(
    () =>
      filter.query !== '' ||
      filter.dualUseOnly ||
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

  return { filter, isActive, toggleCategory, toggleMission, toggleOrbit, toggleOwner, reset }
})
