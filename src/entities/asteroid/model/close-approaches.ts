import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { toCloseApproach, type CloseApproach } from '../lib/approach'

interface Snapshot {
  fetchedAt: string
  source: string
  approaches: CloseApproach[]
}

async function fetchSnapshot(): Promise<Snapshot> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/neo-snapshot.json`)
  if (!response.ok) throw new Error(`Close approach request failed: ${response.status}`)
  const body = (await response.json()) as { fetchedAt?: unknown; source?: unknown; approaches?: unknown }
  const approaches = Array.isArray(body.approaches) ? body.approaches.map(toCloseApproach).filter((item): item is CloseApproach => item !== null) : []
  return { fetchedAt: String(body.fetchedAt ?? ''), source: String(body.source ?? ''), approaches }
}

/** NASA/JPL 근접 접근 자료의 주간 스냅샷(`public/data/neo-snapshot.json`, `bun run data:neo`). `active`가 참이 된 뒤에 받습니다. */
export function useCloseApproaches(active: Ref<boolean>) {
  const query = useQuery({
    queryKey: ['close-approaches'],
    queryFn: fetchSnapshot,
    enabled: active,
    staleTime: 6 * 3_600_000,
  })
  const fetchedAt = computed(() => {
    const date = query.data.value ? new Date(query.data.value.fetchedAt) : null
    return date && !Number.isNaN(date.getTime()) ? date : null
  })
  return {
    approaches: computed(() => query.data.value?.approaches ?? []),
    fetchedAt,
    isPending: query.isPending,
    isError: query.isLoadingError,
    refetch: query.refetch,
  }
}
