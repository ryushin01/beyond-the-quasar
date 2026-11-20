import type { Ref } from 'vue'

export interface HeadingDragOptions {
  /** 포인터를 붙잡을 요소 */
  target: Ref<HTMLElement | undefined>
  /** 바라보는 방위(도) */
  heading: Ref<number>
  /** 가로로 1px 끌 때 도는 각도 */
  degreesPerPixel: () => number
  /** 방위가 바뀐 뒤 다시 그립니다. */
  onTurn: () => void
}

/** 하늘을 가로로 끌어 바라보는 방위를 돌립니다. 처음 누른 포인터만 따릅니다. */
export function createHeadingDrag({ target, heading, degreesPerPixel, onTurn }: HeadingDragOptions) {
  let drag: { pointerId: number; x: number; heading: number } | null = null

  return {
    onPointerDown(event: PointerEvent): void {
      if (event.button !== 0) return
      drag = { pointerId: event.pointerId, x: event.clientX, heading: heading.value }
      target.value?.setPointerCapture?.(event.pointerId)
    },
    onPointerMove(event: PointerEvent): void {
      if (!drag || event.pointerId !== drag.pointerId) return
      heading.value = drag.heading - (event.clientX - drag.x) * degreesPerPixel()
      onTurn()
    },
    onPointerEnd(event: PointerEvent): void {
      if (drag?.pointerId === event.pointerId) drag = null
    },
  }
}
