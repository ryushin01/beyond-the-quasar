// NOAA 우주기상예보센터(SWPC)의 등급·Kp 공개 JSON을 받아, 앱이 NOAA에 닿지 못할 때(오프라인·차단·시간 초과) 대신 보여 줄 스냅샷으로 저장합니다.
// NOAA 자료는 미국 정부 저작물이라 저작권 제한이 없습니다(출처 표시: NOAA SWPC).
// 사용: bun run data:space-weather
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SCALES_URL = 'https://services.swpc.noaa.gov/products/noaa-scales.json'
export const KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'
const OUTPUT = 'public/data/space-weather-snapshot.json'
/** 스냅샷 크기를 줄이려고 Kp는 최근 24시간(3시간 간격 8개)만 남깁니다. 화면도 이만큼만 그립니다. */
const KP_SAMPLES = 8

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

/** 저장하면 안 되는 이유. 문제가 없으면 null */
export function findSpaceWeatherProblem(scales, kp) {
  if (!isObject(scales) || !isObject(scales['0'])) return '등급 응답 형식이 다릅니다'
  if (!Array.isArray(kp) || kp.length === 0) return 'Kp 응답 형식이 다릅니다'
  return null
}

async function getJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.json()
}

async function main() {
  let scales
  let kp
  try {
    ;[scales, kp] = await Promise.all([getJson(SCALES_URL), getJson(KP_URL)])
  } catch (error) {
    console.error(`기존 스냅샷을 유지합니다: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
  const problem = findSpaceWeatherProblem(scales, kp)
  if (problem) {
    console.error(`기존 스냅샷을 유지합니다: ${problem}`)
    process.exit(1)
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  await writeFile(
    path.join(root, OUTPUT),
    `${JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'NOAA SWPC', scales, kp: kp.slice(-KP_SAMPLES) }, null, 2)}\n`,
  )
  console.log('우주 기상 스냅샷을 저장했습니다.')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main()
