import { describe, expect, it } from 'vitest'

import { readScene } from './scene'

const VIEWPORT = 1000
const at = (scroll: number): number[] => [0, 1000, 2000, 3000].map((top) => top - scroll)

describe('readScene', () => {
  it('처음에는 입구 장면이 그대로 보인다', () => {
    expect(readScene({ tops: at(0), viewport: VIEWPORT, motion: true })).toEqual({ mix: 0, fall: 0, dim: 0, active: 0 })
  })

  it('일정 구역에서는 입구 장면을 어둡게 한다', () => {
    const scene = readScene({ tops: at(1000), viewport: VIEWPORT, motion: true })
    expect(scene.dim).toBeCloseTo(1)
    expect(scene.mix).toBe(0)
    expect(scene.active).toBe(1)
  })

  it('지평선 구역에 닿으면 블랙홀로 완전히 넘어간다', () => {
    const scene = readScene({ tops: at(1950), viewport: VIEWPORT, motion: true })
    expect(scene.mix).toBe(1)
    expect(scene.dim).toBe(0)
    expect(scene.active).toBe(2)
  })

  it('귀환 구역에서는 블랙홀로 떨어진다', () => {
    expect(readScene({ tops: at(2500), viewport: VIEWPORT, motion: true }).fall).toBeCloseTo(0.5)
    expect(readScene({ tops: at(3000), viewport: VIEWPORT, motion: true }).fall).toBe(1)
  })

  it('모션을 끄면 중간값 없이 구역 단위로 바뀐다', () => {
    expect(readScene({ tops: at(1400), viewport: VIEWPORT, motion: false })).toEqual({ mix: 0, fall: 0, dim: 1, active: 1 })
    expect(readScene({ tops: at(1600), viewport: VIEWPORT, motion: false })).toEqual({ mix: 1, fall: 0, dim: 0, active: 2 })
  })
})
