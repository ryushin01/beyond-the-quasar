export interface SceneState {
  mix: number
  fall: number
  dim: number
  active: number
}

export interface SceneInput {
  /** 각 구역 윗변의 화면 기준 위치(px), 순서는 신호, 일정, 지평선, 귀환 */
  tops: readonly number[]
  viewport: number
  motion: boolean
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/** 구역 위치로 장면 값을 구합니다. 모션을 끄면 중간값 없이 구역 단위로 바뀝니다. */
export function readScene({ tops, viewport, motion }: SceneInput): SceneState {
  const [, calendar = viewport, horizon = viewport, leaving = viewport] = tops
  const reading = viewport / 2
  const active = tops.reduce((current, top, index) => (top <= reading ? index : current), 0)

  if (!motion) return { mix: active >= 2 ? 1 : 0, fall: active >= 3 ? 1 : 0, dim: active === 1 ? 1 : 0, active }

  const mix = clamp01(1 - (horizon - viewport * 0.1) / (viewport * 0.8))
  const fall = clamp01(1 - leaving / viewport)
  const dim = clamp01(1 - calendar / viewport) * (1 - mix)
  return { mix, fall, dim, active }
}
