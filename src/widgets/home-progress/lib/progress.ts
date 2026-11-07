export interface StopBox {
  top: number
  height: number
}

export interface StopProgress {
  /** 구역별 채움 정도(0~1) */
  fills: number[]
  /** 기준선이 들어 있는 구역. 어느 구역에도 없으면 -1 */
  active: number
}

/** 화면 기준선(`line`)이 각 구역을 얼마나 지났는지 계산합니다. 구역의 `top`은 같은 좌표계의 값입니다. */
export function readProgress(line: number, boxes: StopBox[]): StopProgress {
  const fills = boxes.map(({ top, height }) => (height > 0 ? Math.min(1, Math.max(0, (line - top) / height)) : 0))
  const active = boxes.findIndex(({ top, height }) => line >= top && line < top + height)
  return { fills, active }
}
