/** 이 날수를 넘긴 스냅샷은 낮은 궤도의 위치 오차가 수십 km까지 커질 수 있어 화면에 알립니다. */
export const STALE_SNAPSHOT_DAYS = 10

const DAY_MS = 86_400_000

/** 스냅샷을 받은 지 며칠 지났는지. 오래되지 않았으면 null */
export function staleSnapshotDays(fetchedAt: Date | null, now: Date): number | null {
  if (!fetchedAt) return null
  const days = Math.floor((now.getTime() - fetchedAt.getTime()) / DAY_MS)
  return days > STALE_SNAPSHOT_DAYS ? days : null
}
