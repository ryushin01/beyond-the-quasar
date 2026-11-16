import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { parseKp, parseScales, type SpaceWeather } from '../lib/parse'

const SCALES_URL = 'https://services.swpc.noaa.gov/products/noaa-scales.json'
const KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Space weather request failed: ${response.status}`)
  return response.json()
}

async function fetchSpaceWeather(): Promise<SpaceWeather> {
  const [scales, kp] = await Promise.all([getJson(SCALES_URL), getJson(KP_URL)])
  return { ...parseScales(scales), kp: parseKp(kp) }
}

/**
 * NOAA 우주기상예보센터(SWPC)의 공개 JSON을 브라우저에서 바로 받습니다(CORS 허용, CSP connect-src에 등록).
 * `active`가 참이 된 뒤에만 받아(패널이 화면에 들어온 뒤), 보지 않는 사람은 외부 요청을 하지 않습니다.
 */
export function useSpaceWeather(active: Ref<boolean>) {
  const query = useQuery({
    queryKey: ['space-weather'],
    queryFn: fetchSpaceWeather,
    enabled: active,
    staleTime: 10 * 60_000,
    // NOAA는 1~3분마다 갱신하지만 등급은 천천히 바뀌므로, 화면을 보고 있는 동안 15분마다 다시 받습니다.
    refetchInterval: 15 * 60_000,
    retry: 1,
  })
  return {
    weather: computed(() => query.data.value ?? null),
    isPending: query.isPending,
    // 처음 받기가 실패했을 때만 오류로 봅니다. 다시 받기 실패에는 받아 둔 값을 계속 보여 줍니다.
    isError: query.isLoadingError,
    refetch: query.refetch,
  }
}
