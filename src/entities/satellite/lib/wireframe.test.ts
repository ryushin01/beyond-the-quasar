import { describe, expect, it } from 'vitest'

import { MISSIONS } from '../model/types'
import { wireframeFormOf, wireframePath, wireframeSegments } from './wireframe'

describe('wireframe', () => {
  it('모든 임무에 형상이 있다', () => {
    for (const mission of MISSIONS) {
      expect(wireframeSegments(wireframeFormOf(mission)).length, mission).toBeGreaterThan(10)
    }
  })

  it('통신은 안테나, 정찰은 광학, 유인은 정거장 형상을 쓴다', () => {
    expect(wireframeFormOf('milsatcom')).toBe('dish')
    expect(wireframeFormOf('isr')).toBe('optical')
    expect(wireframeFormOf('crewed')).toBe('station')
  })

  it('회전하지 않으면 x, y를 그대로 옮기고 위쪽을 음수로 그린다', () => {
    expect(wireframePath([[[1, 1, 0], [0, 0, 1]]], 0, 0)).toBe('M100.0 -100.0L0.0 0.0')
  })

  it('요를 90도 돌리면 z가 x 자리로 온다', () => {
    expect(wireframePath([[[0, 0, 1], [0, 0, 0]]], 90, 0)).toBe('M100.0 0.0L0.0 0.0')
  })

  it('화면 안에 들어오는 크기다', () => {
    for (const mission of MISSIONS) {
      const numbers = wireframePath(wireframeSegments(wireframeFormOf(mission)), 35, 25).match(/-?\d+\.\d/g)!.map(Number)
      expect(Math.max(...numbers.map(Math.abs)), mission).toBeLessThan(180)
    }
  })
})
