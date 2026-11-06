import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { readStorage, writeStorage } from '@/shared/lib'

export interface ObservationEntry {
  id: string
  targetName: string
  siteId: string
  seeing: number
  note: string
  loggedAt: string
}

const STORAGE_KEY = 'btq:observation-log'

export const useObservationLog = defineStore('observation-log', () => {
  const entries = ref<ObservationEntry[]>(readStorage(STORAGE_KEY, []))
  watch(entries, (value) => writeStorage(STORAGE_KEY, value), { deep: true })

  function add(entry: Omit<ObservationEntry, 'id' | 'loggedAt'>): void {
    entries.value = [{ ...entry, id: crypto.randomUUID(), loggedAt: new Date().toISOString() }, ...entries.value]
  }
  function remove(id: string): void {
    entries.value = entries.value.filter((entry) => entry.id !== id)
  }
  return { entries, add, remove }
})
