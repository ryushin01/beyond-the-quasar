import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

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
    staleTime: Infinity,
  })
  const satellites = computed<Satellite[]>(() => (query.data.value ? toSatellites(query.data.value) : []))
  const fetchedAt = computed(() => (query.data.value ? new Date(query.data.value.fetchedAt) : null))
  return { satellites, fetchedAt, isPending: query.isPending, isError: query.isError, refetch: query.refetch }
}
