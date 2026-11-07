import type { Satellite } from '@/entities/satellite'

export type CommandItem =
  | { kind: 'page'; id: string; label: string; to: string }
  | { kind: 'site'; id: string; label: string; siteId: string }
  | { kind: 'satellite'; id: string; label: string; satellite: Satellite }

export interface CommandSources {
  pages: { to: string; label: string }[]
  sites: { id: string; label: string }[]
  satellites: Satellite[]
  watched: readonly number[]
}

const SATELLITE_LIMIT = 8

const toSatelliteItem = (satellite: Satellite): CommandItem => ({ kind: 'satellite', id: `sat-${satellite.noradId}`, label: satellite.name, satellite })

/** 이름 앞부분이 맞는 위성을 먼저, 그다음 이름·NORAD 번호·국제 식별 번호가 포함된 위성을 보여 줍니다. */
function rankSatellites(satellites: Satellite[], query: string): Satellite[] {
  const scored: { satellite: Satellite; score: number }[] = []
  for (const satellite of satellites) {
    const name = satellite.name.toLowerCase()
    const id = String(satellite.noradId)
    let score = -1
    if (name.startsWith(query) || id === query) score = 0
    else if (name.includes(query) || id.includes(query) || (satellite.objectId ?? '').toLowerCase().includes(query)) score = 1
    if (score >= 0) scored.push({ satellite, score })
  }
  return scored.sort((a, b) => a.score - b.score).map((item) => item.satellite)
}

/** 검색어가 없으면 화면과 관심 위성을, 있으면 일치하는 위성·화면·지상국을 돌려줍니다. */
export function searchCommands(rawQuery: string, sources: CommandSources): CommandItem[] {
  const query = rawQuery.trim().toLowerCase()
  const pages: CommandItem[] = sources.pages.map((page) => ({ kind: 'page', id: `page-${page.to}`, label: page.label, to: page.to }))
  if (!query) {
    const watched = sources.satellites.filter((satellite) => sources.watched.includes(satellite.noradId))
    return [...pages, ...watched.slice(0, SATELLITE_LIMIT).map(toSatelliteItem)]
  }
  const sites: CommandItem[] = sources.sites.map((site) => ({ kind: 'site', id: `site-${site.id}`, label: site.label, siteId: site.id }))
  return [
    ...rankSatellites(sources.satellites, query).slice(0, SATELLITE_LIMIT).map(toSatelliteItem),
    ...pages.filter((item) => item.label.toLowerCase().includes(query)),
    ...sites.filter((item) => item.label.toLowerCase().includes(query)),
  ]
}
