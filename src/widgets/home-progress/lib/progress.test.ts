import { describe, expect, it } from 'vitest'

import { readProgress } from './progress'

const BOXES = [
  { top: 100, height: 100 },
  { top: 200, height: 200 },
]

describe('readProgress', () => {
  it('지난 구역은 다 채우고 현재 구역은 지난 만큼만 채운다', () => {
    expect(readProgress(300, BOXES)).toEqual({ fills: [1, 0.5], active: 1 })
  })

  it('첫 구역 전과 마지막 구역 뒤에는 현재 구역이 없다', () => {
    expect(readProgress(50, BOXES)).toEqual({ fills: [0, 0], active: -1 })
    expect(readProgress(400, BOXES)).toEqual({ fills: [1, 1], active: -1 })
  })

  it('높이가 0인 구역은 채우지 않는다', () => {
    expect(readProgress(10, [{ top: 0, height: 0 }]).fills).toEqual([0])
  })
})
