import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { isInteger, readStorageList, writeStorage } from '@/shared/lib'

const STORAGE_KEY = 'btq:watchlist'

/** 사용자가 표시한 관심 위성. 이 브라우저에만 저장합니다. */
export const useWatchlist = defineStore('watchlist', () => {
  const ids = ref<number[]>(readStorageList(STORAGE_KEY, isInteger))

  watch(ids, (value) => writeStorage(STORAGE_KEY, value), { deep: true })

  const has = (id: number): boolean => ids.value.includes(id)
  function toggle(id: number): void {
    ids.value = has(id) ? ids.value.filter((item) => item !== id) : [...ids.value, id]
  }

  return { ids, has, toggle }
})
