import { describe, expect, it } from 'vitest'

import { landDots, projectToView } from './globe'

describe('projectToView', () => {
  const view = { longitude: 127, latitude: 30 }

  it('시점 중심은 화면 가운데에 온다', () => {
    const point = projectToView(127, 30, view)
    expect(point.x).toBeCloseTo(0)
    expect(point.y).toBeCloseTo(0)
    expect(point.z).toBeCloseTo(1)
  })

  it('정반대 지점은 보이지 않는 반구에 있다', () => {
    expect(projectToView(-53, -30, view).z).toBeCloseTo(-1)
  })

  it('동쪽은 오른쪽, 북쪽은 위쪽이다', () => {
    expect(projectToView(140, 30, view).x).toBeGreaterThan(0)
    expect(projectToView(127, 50, view).y).toBeGreaterThan(0)
  })
})

describe('landDots', () => {
  it('육지로 판정된 곳에만 점을 찍는다', () => {
    const dots = landDots((longitude) => longitude >= 0)
    expect(dots.length).toBeGreaterThan(0)
    expect(dots.every(([longitude]) => longitude >= 0)).toBe(true)
  })

  it('고위도일수록 경도 간격을 넓힌다', () => {
    const dots = landDots(() => true, 2)
    const count = (latitude: number): number => dots.filter((dot) => dot[1] === latitude).length
    expect(count(60)).toBeLessThan(count(0))
  })
})
