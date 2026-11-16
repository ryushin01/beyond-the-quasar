import { useQuery } from '@tanstack/vue-query'
import { useIntervalFn, useNow } from '@vueuse/core'
import { computed } from 'vue'

import { staleSnapshotDays } from '../lib/freshness'
import { classifyOrbit, tleEpoch } from '../lib/orbit'
import type { Satellite, Snapshot } from './types'

async function fetchSnapshot(): Promise<Snapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/tle-snapshot.json`)
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`)
  return response.json() as Promise<Snapshot>
}

function toSatellites(snapshot: Snapshot): Satellite[] {
  return snapshot.satellites.map((record) => ({
    ...record,
    orbit: classifyOrbit(record.line2),
    epoch: tleEpoch(record.line1),
  }))
}

export function useSatelliteCatalog() {
  const query = useQuery({
    queryKey: ['satellite-catalog'],
    queryFn: fetchSnapshot,
    // 화면을 며칠씩 열어 두어도 주간 갱신된 스냅샷을 받도록, 6시간이 지나면 다음 진입·창 복귀 때 다시 받습니다.
    staleTime: 6 * 3_600_000,
  })
  const satellites = computed<Satellite[]>(() => (query.data.value ? toSatellites(query.data.value) : []))
  const fetchedAt = computed(() => (query.data.value ? new Date(query.data.value.fetchedAt) : null))
  // 화면을 열어 둔 채 날이 바뀌어도 경고를 다시 판단하도록 1시간마다 시각을 갱신합니다.
  const now = useNow({ scheduler: (tick) => useIntervalFn(tick, 3_600_000) })
  /** 스냅샷이 오래됐으면 지난 날수(화면 경고용), 아니면 null */
  const staleDays = computed(() => staleSnapshotDays(fetchedAt.value, now.value))
  return { satellites, fetchedAt, staleDays, isPending: query.isPending, isError: query.isError, refetch: query.refetch }
}
