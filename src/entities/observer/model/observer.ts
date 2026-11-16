import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { isFiniteNumber, isOneOf, isRecordOf, readStorage, writeStorage, type StorageGuard } from '@/shared/lib'

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

/** 브라우저 위치로 정한 관측지의 번호(i18n 키 `sites.here`) */
export const HERE_ID = 'here'

const STORAGE_KEY = 'btq:site'
const HERE_KEY = 'btq:here'

interface Coordinates {
  latitude: number
  longitude: number
}

const isCoordinates: StorageGuard<Coordinates> = (value): value is Coordinates =>
  isRecordOf<Coordinates>({ latitude: isFiniteNumber, longitude: isFiniteNumber })(value) &&
  Math.abs(value.latitude) <= 90 &&
  Math.abs(value.longitude) <= 180

/** 개인 위치가 정밀하게 남지 않도록 소수 둘째 자리(약 1 km)로 줄입니다. */
const coarse = (value: number): number => Math.round(value * 100) / 100

export const useObserver = defineStore('observer', () => {
  const here = ref<Coordinates | null>(readStorage<Coordinates | null>(HERE_KEY, null, (value): value is Coordinates | null => value === null || isCoordinates(value)))
  // 없어진 관측지 번호가 저장돼 있으면 기본 관측지로 돌아갑니다(이름 번역 키가 없어 화면에 키가 보이지 않게).
  const validIds = [...SITES.map((item) => item.id), ...(here.value ? [HERE_ID] : [])]
  const siteId = ref(readStorage<string>(STORAGE_KEY, 'daejeon', isOneOf(validIds)))

  const site = computed<Site>(() => {
    if (siteId.value === HERE_ID && here.value) return { id: HERE_ID, ...here.value, elevationM: 0 }
    return SITES.find((item) => item.id === siteId.value) ?? SITES[0]!
  })

  /** 브라우저 위치를 관측지로 씁니다. 좌표는 줄여서 이 브라우저에만 저장합니다. */
  function setHere(coordinates: Coordinates): void {
    here.value = { latitude: coarse(coordinates.latitude), longitude: coarse(coordinates.longitude) }
    siteId.value = HERE_ID
  }

  watch(siteId, (id) => writeStorage(STORAGE_KEY, id))
  watch(here, (value) => writeStorage(HERE_KEY, value))

  return { siteId, site, here, setHere }
})
