import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createHeadingDrag } from './heading-drag'

const pointer = (pointerId: number, clientX: number, button = 0) => ({ pointerId, clientX, button }) as PointerEvent

describe('createHeadingDrag', () => {
  it('왼쪽 버튼으로 처음 누른 포인터만 따라 방위를 돌린다', () => {
    const heading = ref(180)
    const onTurn = vi.fn()
    const drag = createHeadingDrag({ target: ref(), heading, degreesPerPixel: () => 0.5, onTurn })

    drag.onPointerDown(pointer(1, 100, 2))
    drag.onPointerMove(pointer(1, 140))
    expect(heading.value).toBe(180)

    drag.onPointerDown(pointer(1, 100))
    drag.onPointerMove(pointer(2, 300))
    expect(heading.value).toBe(180)
    drag.onPointerMove(pointer(1, 140))
    expect(heading.value).toBe(160)
    drag.onPointerMove(pointer(1, 60))
    expect(heading.value).toBe(200)
    expect(onTurn).toHaveBeenCalledTimes(2)

    drag.onPointerEnd(pointer(1, 60))
    drag.onPointerMove(pointer(1, 0))
    expect(heading.value).toBe(200)
  })

  it('누를 때 포인터를 붙잡아 캔버스 밖으로 끌어도 놓치지 않는다', () => {
    const element = document.createElement('canvas')
    const capture = vi.fn()
    element.setPointerCapture = capture
    const drag = createHeadingDrag({ target: ref(element), heading: ref(0), degreesPerPixel: () => 1, onTurn: () => {} })
    drag.onPointerDown(pointer(7, 10))
    expect(capture).toHaveBeenCalledWith(7)
  })
})
