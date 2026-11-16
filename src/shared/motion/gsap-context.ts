import { onBeforeUnmount, onMounted, watch, type Ref, type WatchSource } from 'vue'

import { gsap, ScrollTrigger } from './gsap'
import { useMotionPreference } from './preference'

export interface GsapContextOptions {
  /** 모션 설정 말고도 연출을 다시 만들 조건(언어, 인트로 끝남 등) */
  watch?: WatchSource[]
  /** 모션 허용 여부와 상관없이 만들기 전에 매번 할 일(상태 초기화, 정지 화면 그리기 등) */
  before?: () => void
  /** 만든 뒤 ScrollTrigger 위치를 다시 계산합니다. 화면을 붙잡는(pin) 구역이 있을 때 씁니다. */
  refresh?: boolean
}

/**
 * 컴포넌트의 GSAP 연출을 `gsap.context` 하나로 묶어 관리합니다.
 * 화면에 붙은 뒤(`flush: 'post'`) 만들고, 모션 설정(또는 `watch` 조건)이 바뀌면 되돌린 뒤 다시 만들며, 사라질 때 되돌립니다.
 * 모션이 꺼져 있으면 연출을 만들지 않으므로, 기본 CSS는 연출 없이도 완성된 화면이어야 합니다.
 */
export function useGsapContext(root: Ref<HTMLElement | undefined>, setup: (context: gsap.Context) => void, options: GsapContextOptions = {}) {
  const { enabled } = useMotionPreference()
  let context: gsap.Context | undefined

  function build(): void {
    context?.revert()
    context = undefined
    options.before?.()
    if (!enabled.value) return
    context = gsap.context((self) => setup(self), root.value)
    if (options.refresh) ScrollTrigger.refresh()
  }

  onMounted(() => {
    watch([enabled, ...(options.watch ?? [])], build, { immediate: true, flush: 'post' })
  })
  onBeforeUnmount(() => {
    context?.revert()
    context = undefined
  })

  return { rebuild: build }
}
