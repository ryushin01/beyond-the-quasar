import { usePreferredReducedMotion } from '@vueuse/core'
import { computed, ref, watchEffect } from 'vue'

import { readStorage, writeStorage } from '../lib/storage'

const STORAGE_KEY = 'btq:motion-paused'
const userPaused = ref(readStorage(STORAGE_KEY, false))
let synced = false

/** OS의 동작 줄이기 설정과 사용자의 정지 버튼을 합친 모션 허용 상태 */
export function useMotionPreference() {
  const reduced = usePreferredReducedMotion()
  const enabled = computed(() => reduced.value !== 'reduce' && !userPaused.value)

  if (!synced) {
    synced = true
    watchEffect(() => {
      document.documentElement.dataset.motion = enabled.value ? 'on' : 'off'
      writeStorage(STORAGE_KEY, userPaused.value)
    })
  }

  function toggle(): void {
    userPaused.value = !userPaused.value
  }

  return { enabled, reduced, userPaused, toggle }
}

/** 프리로더가 끝난 뒤 첫 화면 연출을 시작하도록 알리는 신호 */
export const introDone = ref(false)
