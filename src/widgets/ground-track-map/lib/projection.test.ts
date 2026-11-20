import { describe, expect, it } from 'vitest'

import { buildProjection, dragRotation, nearestPoint, rotationToward } from './projection'

const SIZE = { width: 960, height: 520 }
const IDENTITY = { k: 1, x: 0, y: 0 }

describe('buildProjection', () => {
  it('평면 지도는 화면 안에 맞추고, 확대·이동을 더한다', () => {
    const [x, y] = buildProjection('flat', SIZE, IDENTITY, { lambda: 0, phi: 0 })([0, 0])!
    expect(x).toBeCloseTo(480, 0)
    expect(y).toBeCloseTo(260, 0)
    const [movedX] = buildProjection('flat', SIZE, { k: 2, x: -480, y: -260 }, { lambda: 0, phi: 0 })([0, 0])!
    expect(movedX).toBeCloseTo(480, 0)
  })

  it('지구본은 짧은 변에 맞춘 반지름에 확대 배율을 곱하고, 회전한 쪽을 가운데에 둔다', () => {
    const globe = buildProjection('globe', SIZE, { k: 2, x: 0, y: 0 }, { lambda: -127, phi: -36 })
    expect(globe.scale()).toBe((260 - 12) * 2)
    const [x, y] = globe([127, 36])!
    expect(x).toBeCloseTo(480)
    expect(y).toBeCloseTo(260)
  })
})

describe('rotationToward', () => {
  it('경도는 가까운 쪽으로 돌고 위도는 0.7배만 기울인다', () => {
    const next = rotationToward({ lambda: 170, phi: 0 }, 175, 40)
    expect(next.lambda).toBe(185)
    expect(next.phi).toBeCloseTo(-28)
    expect(rotationToward({ lambda: -170, phi: 0 }, -175, 0).lambda).toBe(-185)
  })
})

describe('dragRotation', () => {
  it('끈 만큼 돌리되 확대할수록 덜 돌고, 위도는 ±85°에서 멈춘다', () => {
    expect(dragRotation({ lambda: 0, phi: 0 }, 100, 0, 1)).toEqual({ lambda: 30, phi: 0 })
    expect(dragRotation({ lambda: 0, phi: 0 }, 100, 0, 2)).toEqual({ lambda: 15, phi: 0 })
    expect(dragRotation({ lambda: 0, phi: 80 }, 0, -100, 1).phi).toBe(85)
    expect(dragRotation({ lambda: 0, phi: -80 }, 0, 100, 1).phi).toBe(-85)
  })
})

describe('nearestPoint', () => {
  const points = [
    { id: 'a', x: 10, y: 10 },
    { id: 'b', x: 30, y: 10 },
  ]

  it('반경 14px 안에서 가장 가까운 점을 고른다', () => {
    expect(nearestPoint(points, 12, 10)?.id).toBe('a')
    expect(nearestPoint(points, 25, 12)?.id).toBe('b')
    expect(nearestPoint(points, 10, 24)).toBeNull()
    expect(nearestPoint(points, 10, 23.9)?.id).toBe('a')
  })
})
