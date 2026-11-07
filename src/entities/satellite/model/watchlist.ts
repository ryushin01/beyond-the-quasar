import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { readStorage, writeStorage } from '@/shared/lib'

const STORAGE_KEY = 'btq:watchlist'

/** 사용자가 표시한 관심 위성. 이 브라우저에만 저장합니다. */
export const useWatchlist = defineStore('watchlist', () => {
  const stored = readStorage<unknown>(STORAGE_KEY, [])
  const ids = ref<number[]>(Array.isArray(stored) ? stored.filter((id): id is number => Number.isInteger(id)) : [])

  watch(ids, (value) => writeStorage(STORAGE_KEY, value), { deep: true })

  const has = (id: number): boolean => ids.value.includes(id)
  function toggle(id: number): void {
    ids.value = has(id) ? ids.value.filter((item) => item !== id) : [...ids.value, id]
  }

  return { ids, has, toggle }
})
