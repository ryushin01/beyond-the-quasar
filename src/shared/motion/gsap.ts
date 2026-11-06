import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Histoire가 스토리를 수집하는 환경에는 matchMedia가 없습니다.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') gsap.registerPlugin(ScrollTrigger)

/** 프로젝트 공통 이징. 빠르게 나와 정확히 멈추는 움직임으로 통일합니다. */
export const EASE = {
  out: 'expo.out',
  inOut: 'expo.inOut',
  soft: 'power3.out',
} as const

export { gsap, ScrollTrigger }
