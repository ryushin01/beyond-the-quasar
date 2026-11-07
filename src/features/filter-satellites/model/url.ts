import { onMounted, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import { CATEGORIES, EMPTY_FILTER, MISSIONS, ORBITS, type SatelliteFilter } from '@/entities/satellite'

import { useSatelliteFilter } from './filter'

const FILTER_KEYS = ['q', 'category', 'mission', 'orbit', 'owner', 'dualUse'] as const

const listOf = (value: LocationQuery[string] | undefined): string[] => {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ? raw.split(',').filter(Boolean) : []
}
const allowed = <T extends string>(values: string[], list: readonly T[]): T[] =>
  values.filter((value): value is T => (list as readonly string[]).includes(value))

/** 주소의 값은 누구나 바꿀 수 있으므로 허용된 값만 받습니다. 관심 위성은 개인 설정이라 주소에 넣지 않습니다. */
export function queryToFilter(query: LocationQuery): SatelliteFilter {
  const text = Array.isArray(query.q) ? query.q[0] : query.q
  return {
    ...EMPTY_FILTER,
    query: text ?? '',
    categories: allowed(listOf(query.category), CATEGORIES),
    missions: allowed(listOf(query.mission), MISSIONS),
    orbits: allowed(listOf(query.orbit), ORBITS),
    owners: listOf(query.owner),
    dualUseOnly: query.dualUse === '1',
  }
}

export function filterToQuery(filter: SatelliteFilter): Record<string, string> {
  const query: Record<string, string> = {}
  if (filter.query) query.q = filter.query
  if (filter.categories.length) query.category = filter.categories.join(',')
  if (filter.missions.length) query.mission = filter.missions.join(',')
  if (filter.orbits.length) query.orbit = filter.orbits.join(',')
  if (filter.owners.length) query.owner = filter.owners.join(',')
  if (filter.dualUseOnly) query.dualUse = '1'
  return query
}

const withoutFilter = (query: LocationQuery): LocationQuery =>
  Object.fromEntries(Object.entries(query).filter(([key]) => !(FILTER_KEYS as readonly string[]).includes(key)))

/** 비교용 값. 주소를 직접 고친 경우와 필터를 바꿔 주소를 쓴 경우를 구분합니다. */
const signature = (filter: SatelliteFilter): string => JSON.stringify(filterToQuery(filter))

/** 카탈로그 필터와 주소를 맞춥니다. 필터 상태 그대로 링크를 공유할 수 있습니다. */
export function useFilterUrlSync(): void {
  const route = useRoute()
  const router = useRouter()
  const store = useSatelliteFilter()
  const path = route.path

  const hasFilterInUrl = (): boolean => FILTER_KEYS.some((key) => key in route.query)

  // 필터가 담긴 주소로 들어오면 그 값이 우선이고, 아니면 이전 화면에서 고른 필터를 유지합니다.
  if (hasFilterInUrl()) Object.assign(store.filter, queryToFilter(route.query))

  function writeUrl(): void {
    if (route.path !== path || signature(store.filter) === signature(queryToFilter(route.query))) return
    void router.replace({ query: { ...withoutFilter(route.query), ...filterToQuery(store.filter) } })
  }

  onMounted(writeUrl)
  watch(() => store.filter, writeUrl, { deep: true })

  // 같은 화면에서 주소만 바뀐 경우(메뉴를 다시 누름, 뒤로 가기)
  watch(
    () => route.query,
    (query) => {
      if (route.path !== path || signature(queryToFilter(query)) === signature(store.filter)) return
      Object.assign(store.filter, queryToFilter(query))
    },
  )
}
