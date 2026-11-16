import { useDebounceFn, useEventListener } from '@vueuse/core'

import { ScrollTrigger } from './gsap'

/**
 * 웹 글꼴은 첫 화면을 그린 뒤 따로 받으므로(main.ts), 글꼴이 바뀌면 구역 높이가 달라집니다.
 * 그 전에 계산한 고정(pin) 구간과 등장 시점이 낡지 않도록, 글꼴 묶음을 다 받을 때마다 위치를 다시 계산합니다.
 */
export function useRefreshOnFontsLoaded(): void {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  // 글꼴 파일 여러 개가 잇달아 끝나므로 한 번으로 모읍니다.
  const refresh = useDebounceFn(() => ScrollTrigger.refresh(), 150)
  useEventListener(document.fonts, 'loadingdone', refresh)
}
