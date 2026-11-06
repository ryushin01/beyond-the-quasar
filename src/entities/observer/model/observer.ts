import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { readStorage, writeStorage } from '@/shared/lib'

export interface Site {
  id: string
  /** i18n 키 `sites.<id>` */
  latitude: number
  longitude: number
  elevationM: number
}

/** 지상국·관측지 프리셋. 좌표는 해당 지역의 대표 좌표이며 시설의 정밀 위치가 아닙니다. */
export const SITES: Site[] = [
  { id: 'daejeon', latitude: 36.35, longitude: 127.38, elevationM: 70 },
  { id: 'seoul', latitude: 37.57, longitude: 126.98, elevationM: 40 },
  { id: 'bohyeonsan', latitude: 36.16, longitude: 128.98, elevationM: 1124 },
  { id: 'svalbard', latitude: 78.23, longitude: 15.4, elevationM: 450 },
  { id: 'maunakea', latitude: 19.82, longitude: -155.47, elevationM: 4205 },
  { id: 'atacama', latitude: -24.63, longitude: -70.4, elevationM: 2635 },
]

const STORAGE_KEY = 'btq:site'

export const useObserver = defineStore('observer', () => {
  const siteId = ref(readStorage(STORAGE_KEY, 'daejeon'))
  const site = computed<Site>(() => SITES.find((item) => item.id === siteId.value) ?? SITES[0]!)

  watch(siteId, (id) => writeStorage(STORAGE_KEY, id))

  return { siteId, site }
})
