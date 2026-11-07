import type { Pass, Satellite } from '../model/types'
import { predictPasses, toSatrec } from './orbit'

export interface PassScheduleRow {
  satellite: Satellite
  passes: Pass[]
  /** 지금 진행 중이거나 다음에 시작할 통과 */
  next: Pass | null
  inProgress: boolean
}

/** 여러 위성의 통과를 한 일정표로 모읍니다. 다음 통과가 빠른 순서이고 통과가 없는 위성은 뒤로 갑니다. */
export function buildPassSchedule(
  satellites: Satellite[],
  observer: { latitude: number; longitude: number; elevationM: number },
  from: Date,
  hours = 24,
): PassScheduleRow[] {
  const nextStart = (row: PassScheduleRow): number => row.next?.aos.getTime() ?? Number.POSITIVE_INFINITY
  return satellites
    .map((satellite) => {
      const passes = predictPasses(toSatrec(satellite.line1, satellite.line2), observer, from, { hours, stepSec: 60, limit: 20 })
      const next = passes[0] ?? null
      return { satellite, passes, next, inProgress: next !== null && next.aos.getTime() <= from.getTime() }
    })
    .sort((a, b) => nextStart(a) - nextStart(b))
}
