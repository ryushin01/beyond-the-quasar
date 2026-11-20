import { describe, expect, it } from 'vitest'

import { acceptsMapGesture } from './zoom'

describe('acceptsMapGesture', () => {
  it('휠은 넓은 화면에서만 확대한다', () => {
    const wheel = new WheelEvent('wheel')
    expect(acceptsMapGesture(wheel, () => true)).toBe(true)
    expect(acceptsMapGesture(wheel, () => false)).toBe(false)
  })

  it('마우스는 왼쪽 버튼으로만 끈다', () => {
    expect(acceptsMapGesture(new MouseEvent('mousedown', { button: 0 }), () => false)).toBe(true)
    expect(acceptsMapGesture(new MouseEvent('mousedown', { button: 2 }), () => false)).toBe(false)
  })
})
