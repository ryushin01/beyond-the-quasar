import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { isDateString, isFiniteNumber, isRecordOf, isString, readStorageList, writeStorage } from '@/shared/lib'

export interface ObservationEntry {
  id: string
  targetName: string
  siteId: string
  seeing: number
  note: string
  loggedAt: string
}

const STORAGE_KEY = 'btq:observation-log'

/** 저장된 관측 기록 한 줄의 형식. 깨졌거나 이전 버전 형식인 줄은 버립니다. */
export const isObservationEntry = isRecordOf<ObservationEntry>({
  id: isString,
  targetName: isString,
  siteId: isString,
  seeing: isFiniteNumber,
  note: isString,
  loggedAt: isDateString,
})

export const useObservationLog = defineStore('observation-log', () => {
  const entries = ref<ObservationEntry[]>(readStorageList(STORAGE_KEY, isObservationEntry))
  watch(entries, (value) => writeStorage(STORAGE_KEY, value), { deep: true })

  function add(entry: Omit<ObservationEntry, 'id' | 'loggedAt'>): void {
    entries.value = [{ ...entry, id: crypto.randomUUID(), loggedAt: new Date().toISOString() }, ...entries.value]
  }
  function remove(id: string): void {
    entries.value = entries.value.filter((entry) => entry.id !== id)
  }
  return { entries, add, remove }
})
