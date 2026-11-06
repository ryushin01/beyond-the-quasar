import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { readStorage, writeStorage } from '@/shared/lib'

const STORAGE_KEY = 'btq:tracked'
const ISS_NORAD_ID = 25544

/** 관제 화면에서 추적 중인 위성 */
export const useTracking = defineStore('tracking', () => {
  const trackedId = ref(readStorage(STORAGE_KEY, ISS_NORAD_ID))
  watch(trackedId, (id) => writeStorage(STORAGE_KEY, id))
  return { trackedId }
})
