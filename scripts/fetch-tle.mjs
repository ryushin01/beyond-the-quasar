// CelesTrak 공개 카탈로그(GP·SATCAT)에서 위성 목록을 받아 앱이 읽는 스냅샷으로 저장합니다.
// 사용: bun run data:tle  (CelesTrak 이용 규칙에 맞게 필요할 때만 실행합니다)
import { writeFile } from 'node:fs/promises'

const NOT_PAYLOAD = /\b(AKM|DEB|R\/B|ABM|PLATFORM|PKM)\b/
const MAX_EPOCH_AGE_DAYS = 45

/**
 * category: 분류, mission: 공개 자료 기준 임무, dualUse: 군·민 겸용
 * pick: 이름 조건, limit: 최신 순으로 남길 수
 */
const FAMILIES = [
  { name: 'AEHF', category: 'military', mission: 'milsatcom' },
  { name: 'WGS', category: 'military', mission: 'milsatcom', pick: /^WGS F/ },
  { name: 'MUOS', category: 'military', mission: 'milsatcom', pick: /^MUOS-/ },
  { name: 'MILSTAR', category: 'military', mission: 'milsatcom', limit: 3 },
  { name: 'SKYNET', category: 'military', mission: 'milsatcom', pick: /^SKYNET 5/ },
  { name: 'SYRACUSE', category: 'military', mission: 'milsatcom' },
  { name: 'SBIRS', category: 'military', mission: 'missile-warning', pick: /^SBIRS/ },
  { name: 'DMSP', category: 'military', mission: 'weather', pick: /DMSP 5D-3/, limit: 4 },
  { name: 'SAR-LUPE', category: 'military', mission: 'isr' },
  { name: 'YAOGAN', category: 'military', mission: 'isr', limit: 12 },
  { name: 'SAPPHIRE', category: 'military', mission: 'ssa', pick: /^SAPPHIRE/ },
  { name: 'VICTUS', category: 'military', mission: 'ssa' },
  { name: 'PRAETORIAN', category: 'military', mission: 'unspecified', limit: 8 },
  { name: 'COSMO-SKYMED', category: 'military', mission: 'isr', dualUse: true, pick: /^COSMO-SKYMED \d$/ },
  { group: 'gps-ops', category: 'navigation', mission: 'pnt', dualUse: true, limit: 10 },
  { group: 'glo-ops', category: 'navigation', mission: 'pnt', dualUse: true, limit: 6 },
  { group: 'beidou', category: 'navigation', mission: 'pnt', dualUse: true, limit: 6 },
  { group: 'galileo', category: 'navigation', mission: 'pnt', limit: 6 },
  { name: 'ARIRANG', category: 'earth-observation', mission: 'imaging', pick: /KOMPSAT-[35]/ },
  { name: 'KOMPSAT-3A', category: 'earth-observation', mission: 'imaging' },
  { name: 'LANDSAT', category: 'earth-observation', mission: 'imaging', pick: /LANDSAT [89]/ },
  { name: 'SENTINEL', category: 'earth-observation', mission: 'imaging', pick: /^SENTINEL-\d[A-D]$/, limit: 6 },
  { name: 'TERRA', category: 'earth-observation', mission: 'imaging', pick: /^TERRA$/ },
  { name: 'AQUA', category: 'earth-observation', mission: 'imaging', pick: /^AQUA$/ },
  { name: 'GEO-KOMPSAT', category: 'weather', mission: 'weather' },
  { group: 'weather', category: 'weather', mission: 'weather', limit: 10 },
  { name: 'KOREASAT', category: 'communications', mission: 'satcom', limit: 3 },
  { name: 'INTELSAT', category: 'communications', mission: 'satcom', limit: 4 },
  { name: 'ONEWEB', category: 'communications', mission: 'satcom', limit: 4 },
  { name: 'STARLINK', category: 'communications', mission: 'satcom', limit: 8 },
  { group: 'science', category: 'science', mission: 'science', limit: 10 },
  { name: 'HST', category: 'science', mission: 'science', pick: /^HST$/ },
  { group: 'stations', category: 'crewed', mission: 'crewed', pick: /^(ISS \(ZARYA\)|CSS \(TIANHE\))$/ },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function getText(url) {
  const response = await fetch(url)
  await sleep(500)
  return response.ok ? response.text() : ''
}

function parseTle(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean)
  const rows = []
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) {
      rows.push({ name: lines[i].trim(), line1: lines[i + 1], line2: lines[i + 2], noradId: Number(lines[i + 1].slice(2, 7)) })
    }
  }
  return rows
}

function epochAgeDays(line1) {
  const yy = Number(line1.slice(18, 20))
  const day = Number(line1.slice(20, 32))
  const epoch = Date.UTC(yy < 57 ? 2000 + yy : 1900 + yy, 0, 1) + (day - 1) * 86_400_000
  return (Date.now() - epoch) / 86_400_000
}

const byId = new Map()

for (const family of FAMILIES) {
  const query = family.group ? `GROUP=${family.group}` : `NAME=${encodeURIComponent(family.name)}`
  const [tleText, catalogText] = [
    await getText(`https://celestrak.org/NORAD/elements/gp.php?${query}&FORMAT=tle`),
    await getText(`https://celestrak.org/satcat/records.php?${query}&FORMAT=json`),
  ]
  let records = []
  try {
    records = JSON.parse(catalogText)
  } catch {
    console.warn(`SATCAT 없음: ${query}`)
  }
  const recordById = new Map(records.map((record) => [record.NORAD_CAT_ID, record]))

  const rows = parseTle(tleText)
    .filter((row) => !NOT_PAYLOAD.test(row.name))
    .filter((row) => !family.pick || family.pick.test(row.name))
    .filter((row) => epochAgeDays(row.line1) <= MAX_EPOCH_AGE_DAYS)
    .filter((row) => !['-', 'D'].includes(recordById.get(row.noradId)?.OPS_STATUS_CODE))
    .sort((a, b) => b.noradId - a.noradId)
    .slice(0, family.limit ?? Infinity)

  for (const row of rows) {
    if (byId.has(row.noradId)) continue
    const record = recordById.get(row.noradId)
    byId.set(row.noradId, {
      ...row,
      category: family.category,
      mission: family.mission,
      dualUse: family.dualUse ?? false,
      objectId: record?.OBJECT_ID ?? null,
      owner: record?.OWNER ?? null,
      launchDate: record?.LAUNCH_DATE ?? null,
      launchSite: record?.LAUNCH_SITE ?? null,
      opsStatus: record?.OPS_STATUS_CODE ?? null,
      apogeeKm: record?.APOGEE ?? null,
      perigeeKm: record?.PERIGEE ?? null,
      periodMin: record?.PERIOD ?? null,
      inclinationDeg: record?.INCLINATION ?? null,
      rcsM2: record?.RCS ?? null,
    })
  }
  console.log(`${query}: ${rows.length}기`)
}

const satellites = [...byId.values()].sort((a, b) => a.noradId - b.noradId)
const MIN_SATELLITES = 100
const militaryCount = satellites.filter((item) => item.category === 'military').length
if (satellites.length < MIN_SATELLITES || militaryCount === 0) {
  console.error(`받은 위성이 너무 적어 기존 스냅샷을 유지합니다: 전체 ${satellites.length}기, 군사 ${militaryCount}기`)
  process.exit(1)
}
await writeFile(
  new URL('../public/data/tle-snapshot.json', import.meta.url),
  `${JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'CelesTrak', satellites })}\n`,
)
console.log(`저장: ${satellites.length}기`)
