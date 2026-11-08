import { useResizeObserver } from '@vueuse/core'

import { ScrollTrigger } from './gsap'

/**
 * 세로 스크롤바가 생기거나 사라지면 문서 폭은 바뀌어도 window의 resize 이벤트는 나지 않습니다.
 * 그대로 두면 ScrollTrigger가 고정 구역에 박아 둔 px 폭이 낡아 가로 스크롤이 생기므로 다시 계산합니다.
 */
export function useRefreshOnDocumentWidth(): void {
  let width = document.documentElement.clientWidth
  useResizeObserver(document.documentElement, () => {
    const next = document.documentElement.clientWidth
    if (next === width) return
    width = next
    ScrollTrigger.refresh()
  })
}
