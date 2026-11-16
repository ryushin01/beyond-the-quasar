/** 이 날수를 넘긴 스냅샷은 낮은 궤도의 위치 오차가 수십 km까지 커질 수 있어 화면에 알립니다. */
export const STALE_SNAPSHOT_DAYS = 10

const DAY_MS = 86_400_000

/** 스냅샷을 받은 지 며칠 지났는지(내림한 날수). 기준을 넘지 않았으면 null */
export function staleSnapshotDays(fetchedAt: Date | null, now: Date): number | null {
  if (!fetchedAt) return null
  // 기준은 내림하기 전의 경과 시간으로 비교합니다(10일 12시간이면 이미 넘음).
  const elapsed = now.getTime() - fetchedAt.getTime()
  return elapsed > STALE_SNAPSHOT_DAYS * DAY_MS ? Math.floor(elapsed / DAY_MS) : null
}
