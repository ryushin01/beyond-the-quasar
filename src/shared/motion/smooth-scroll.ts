import Lenis from 'lenis'
import { onBeforeUnmount, onMounted, watch } from 'vue'

import { gsap, ScrollTrigger } from './gsap'
import { useMotionPreference } from './preference'

let lenis: Lenis | null = null

/** 지정한 요소로 이동합니다. 부드러운 스크롤이 꺼져 있으면 바로 이동합니다. */
export function scrollToElement(element: HTMLElement): void {
  const top = element.getBoundingClientRect().top + window.scrollY
  if (lenis) lenis.scrollTo(top)
  else window.scrollTo(0, top)
}

/**
 * id로 찾은 구역으로 이동하고 그 구역에 초점을 옮깁니다. 진행 표시·목차의 '이동' 버튼이 씁니다.
 * 초점이 화면을 다시 끌어당기지 않게 preventScroll을 씁니다. 구역에는 tabindex="-1"이 있어야 합니다.
 */
export function goToSection(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  scrollToElement(target)
  target.focus({ preventScroll: true })
}

/** 페이지 단위 부드러운 스크롤. 네이티브 스크롤을 유지하므로 키보드 조작은 그대로입니다. */
export function useSmoothScroll(): void {
  const { enabled } = useMotionPreference()
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
