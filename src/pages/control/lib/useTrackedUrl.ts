import { watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useTracking, type Satellite } from '@/entities/satellite'

/** 추적 위성을 주소(`?sat=NORAD`)와 맞춥니다. 없는 번호는 무시하고 주소를 현재 위성으로 고칩니다. */
export function useTrackedUrl(satellites: Ref<Satellite[]>, trackedId: Ref<number | null>): void {
  const route = useRoute()
  const router = useRouter()
  const tracking = useTracking()
  const path = route.path

  const applyUrl = (): void => {
    const id = Number(route.query.sat)
    if (Number.isInteger(id) && satellites.value.some((item) => item.noradId === id)) tracking.trackedId = id
  }

  function writeUrl(id: number | null): void {
    if (id === null || route.path !== path || route.query.sat === String(id)) return
    void router.replace({ query: { ...route.query, sat: String(id) } })
  }

  // 데이터가 준비되어야 번호를 확인할 수 있습니다. 주소를 먼저 읽고 그다음 주소를 씁니다.
  watch(
    () => satellites.value.length,
    (count) => {
      if (!count) return
      applyUrl()
      writeUrl(trackedId.value)
    },
    { immediate: true },
  )
  watch(trackedId, writeUrl)
  watch(() => route.query.sat, () => {
    if (route.path === path) applyUrl()
  })
}
