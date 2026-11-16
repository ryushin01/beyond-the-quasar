// NASA/JPL SBDB Close Approach Data API에서 앞으로 60일 안에 지구 가까이(0.05 AU 안) 지나가는 소행성 목록을 받아
// 앱이 읽는 스냅샷으로 저장합니다. 이 API는 브라우저에서 바로 부를 수 없어(CORS 없음) TLE처럼 주간 Actions로 받습니다.
// 사용: bun run data:neo
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const API = 'https://ssd-api.jpl.nasa.gov/cad.api?dist-max=0.05&date-min=now&date-max=%2B60&sort=date&fullname=true'
const OUTPUT = 'public/data/neo-snapshot.json'
/** 율리우스일(JD)을 Unix 밀리초로 바꿀 때의 기준(1970-01-01T00:00Z = JD 2440587.5) */
const JD_UNIX_EPOCH = 2_440_587.5

/** API 응답(fields + data 행)을 앱이 쓰는 접근 목록으로 바꿉니다. 형식이 다르면 예외를 던집니다. */
export function toApproaches(response) {
  if (!response || !Array.isArray(response.fields) || !Array.isArray(response.data)) throw new Error('응답 형식이 다릅니다')
  const index = Object.fromEntries(response.fields.map((field, i) => [field, i]))
  for (const field of ['des', 'jd', 'dist', 'v_rel', 'h']) {
    if (!(field in index)) throw new Error(`필드가 없습니다: ${field}`)
  }
  const number = (value) => (value === null || value === undefined || value === '' ? null : Number(value))
  return response.data
    .map((row) => {
      const jd = number(row[index.jd])
      return {
        designation: String(row[index.des]),
        name: index.fullname === undefined ? String(row[index.des]) : String(row[index.fullname]).trim(),
        // 접근 시각은 분 단위 정밀도라, 율리우스일을 바꿀 때 생기는 부동소수점 오차(1ms 안팎)를 초 단위 반올림으로 없앱니다.
        date: jd === null ? null : new Date(Math.round(((jd - JD_UNIX_EPOCH) * 86_400_000) / 1000) * 1000).toISOString(),
        distanceAu: number(row[index.dist]),
        velocityKmS: number(row[index.v_rel]),
        absoluteMagnitude: number(row[index.h]),
      }
    })
    .filter((item) => item.date !== null && Number.isFinite(item.distanceAu) && Number.isFinite(item.velocityKmS))
}

/** 저장하면 안 되는 이유. 문제가 없으면 null(앞으로 60일에 가까이 오는 천체가 없을 수도 있어 0건은 허용) */
export function findNeoProblem(response, approaches) {
  if (!response?.signature?.source?.includes('Close Approach')) return '서명이 다릅니다'
  if (Number(response.count) !== approaches.length) return `건수가 맞지 않습니다: ${response.count} / ${approaches.length}`
  return null
}

async function main() {
  const response = await fetch(API)
  if (!response.ok) {
    console.error(`기존 스냅샷을 유지합니다: ${response.status}`)
    process.exit(1)
  }
  const body = await response.json()
  const approaches = toApproaches(body)
  const problem = findNeoProblem(body, approaches)
  if (problem) {
    console.error(`기존 스냅샷을 유지합니다: ${problem}`)
    process.exit(1)
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  await writeFile(
    path.join(root, OUTPUT),
    `${JSON.stringify({ fetchedAt: new Date().toISOString(), source: body.signature.source, approaches }, null, 2)}\n`,
  )
  console.log(`근접 접근 ${approaches.length}건을 저장했습니다.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main()
