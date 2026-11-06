import Lenis from 'lenis'
import { onBeforeUnmount, onMounted, watch } from 'vue'

import { gsap, ScrollTrigger } from './gsap'
import { useMotionPreference } from './preference'

/** 페이지 단위 부드러운 스크롤. 네이티브 스크롤을 유지하므로 키보드 조작은 그대로입니다. */
export function useSmoothScroll(): void {
  const { enabled } = useMotionPreference()
  let lenis: Lenis | null = null
  const raf = (time: number): void => lenis?.raf(time * 1000)

  function start(): void {
    if (lenis) return
    lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }

  function stop(): void {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }

  onMounted(() => {
    watch(enabled, (on) => (on ? start() : stop()), { immediate: true })
  })
  onBeforeUnmount(stop)
}
