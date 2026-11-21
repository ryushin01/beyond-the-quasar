import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { parseKp, parseScales, type SpaceWeather } from '../lib/parse'

const SCALES_URL = 'https://services.swpc.noaa.gov/products/noaa-scales.json'
const KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'
/** NOAA가 이 시간 안에 답하지 않으면 스냅샷으로 넘어갑니다. */
const LIVE_TIMEOUT_MS = 8_000

/** 화면에 보이는 우주 기상과, 그 값이 실시간(NOAA)인지 저장소의 스냅샷인지 */
export interface SpaceWeatherResult {
  weather: SpaceWeather
  /** 스냅샷을 받은 시각. 실시간 값이면 null */
  snapshotAt: Date | null
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, signal ? { signal } : undefined)
  if (!response.ok) throw new Error(`Space weather request failed: ${response.status}`)
  return response.json()
}

async function fetchLive(): Promise<SpaceWeather> {
  const signal = AbortSignal.timeout(LIVE_TIMEOUT_MS)
  const [scales, kp] = await Promise.all([getJson(SCALES_URL, signal), getJson(KP_URL, signal)])
  return { ...parseScales(scales), kp: parseKp(kp) }
}

/** `public/data/space-weather-snapshot.json`(`bun run data:space-weather`, 주간 갱신) */
async function fetchSnapshot(): Promise<SpaceWeatherResult> {
  const body = await getJson(`${import.meta.env.BASE_URL}data/space-weather-snapshot.json`)
  if (typeof body !== 'object' || body === null) throw new Error('Space weather snapshot is not an object')
  const { scales, kp, fetchedAt } = body as { scales?: unknown; kp?: unknown; fetchedAt?: unknown }
  const at = new Date(String(fetchedAt ?? ''))
  return { weather: { ...parseScales(scales), kp: parseKp(kp) }, snapshotAt: Number.isNaN(at.getTime()) ? new Date(0) : at }
}

/** NOAA에서 받지 못하면(오프라인·차단·시간 초과·형식 오류) 저장소의 스냅샷을 보여 줍니다. */
export async function fetchSpaceWeather(): Promise<SpaceWeatherResult> {
  try {
    return { weather: await fetchLive(), snapshotAt: null }
  } catch {
    return fetchSnapshot()
  }
}

/**
 * NOAA 우주기상예보센터(SWPC)의 공개 JSON을 브라우저에서 바로 받습니다(CORS 허용, CSP connect-src에 등록).
 * 받지 못하면 스냅샷으로 대신하고 `snapshotAt`으로 알립니다.
 * `active`가 참이 된 뒤에만 받아(패널이 화면에 들어온 뒤), 보지 않는 사람은 외부 요청을 하지 않습니다.
 */
export function useSpaceWeather(active: Ref<boolean>) {
  const query = useQuery({
    queryKey: ['space-weather'],
    queryFn: fetchSpaceWeather,
    enabled: active,
    staleTime: 10 * 60_000,
    // NOAA는 1~3분마다 갱신하지만 등급은 천천히 바뀌므로, 화면을 보고 있는 동안 15분마다 다시 받습니다(스냅샷이었다면 이때 실시간으로 바뀜).
    refetchInterval: 15 * 60_000,
    retry: 1,
  })
  return {
    weather: computed(() => query.data.value?.weather ?? null),
    snapshotAt: computed(() => query.data.value?.snapshotAt ?? null),
    isPending: query.isPending,
    // 실시간과 스냅샷을 모두 받지 못했을 때만 오류로 봅니다. 다시 받기 실패에는 받아 둔 값을 계속 보여 줍니다.
    isError: query.isLoadingError,
    refetch: query.refetch,
  }
}
