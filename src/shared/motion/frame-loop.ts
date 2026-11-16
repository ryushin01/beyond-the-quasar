import { useEventListener, useIntersectionObserver } from '@vueuse/core'
import { onScopeDispose, watch } from 'vue'

import { useMotionPreference } from './preference'

export interface FrameLoopOptions {
  /** 도는 동안 매 프레임 부릅니다. */
  onFrame: (now: number) => void
  /** 멈출 때(화면 밖, 탭 숨김, 모션 꺼짐) 한 장을 그립니다. 없으면 onFrame을 한 번 부릅니다. */
  onStill?: (now: number) => void
  /** 루프를 돌릴지 정하는 추가 조건(반응형으로 지켜봄). 기본값은 모션 허용 상태 */
  active?: () => boolean
  /** 화면 안으로 들어오거나 나갈 때 */
  onVisible?: (visible: boolean) => void
  /** 루프를 (다시) 시작하기 직전에 */
  onPlay?: () => void
  /** 처음 관찰 결과가 오기 전의 가시 상태 */
  initiallyVisible?: boolean
  threshold?: number
}

/**
 * 화면에 보이고, 탭이 열려 있고, 모션이 허용될 때만 requestAnimationFrame 루프를 돌립니다.
 * 셋 중 하나라도 아니면 루프를 멈추고 정지 화면 한 장만 그립니다. 컴포넌트가 사라지면 정리합니다.
 */
/** 관찰할 요소(useIntersectionObserver가 받는 형식) */
type Target = Parameters<typeof useIntersectionObserver>[0]

export function useVisibleFrameLoop(target: Target, options: FrameLoopOptions) {
  const { enabled } = useMotionPreference()
  const active = options.active ?? (() => enabled.value)
  const still = options.onStill ?? options.onFrame
  let visible = options.initiallyVisible ?? true
  let frame = 0

  function loop(now: number): void {
    options.onFrame(now)
    // onFrame 안에서 stop()이 불렸으면 이어 가지 않습니다.
    if (frame) frame = requestAnimationFrame(loop)
  }

  function stop(): void {
    cancelAnimationFrame(frame)
    frame = 0
  }

  /** 지금 조건으로 루프를 다시 정합니다. 준비가 끝났을 때처럼 조건이 바뀌면 직접 부릅니다. */
  function play(): void {
    stop()
    if (active() && visible && !document.hidden) {
      options.onPlay?.()
      frame = requestAnimationFrame(loop)
    } else {
      still(performance.now())
    }
  }

  useIntersectionObserver(
    target,
    ([entry]) => {
      visible = entry?.isIntersecting ?? true
      options.onVisible?.(visible)
      play()
    },
    { threshold: options.threshold ?? 0 },
  )
  useEventListener(document, 'visibilitychange', play)
  watch(active, play)
  onScopeDispose(stop)

  return { play, stop, isRunning: () => frame !== 0 }
}
