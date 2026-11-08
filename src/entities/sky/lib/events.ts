import { SearchGlobalSolarEclipse, SearchLunarEclipse, SearchMoonPhase, Seasons } from 'astronomy-engine'

export type SkyEventId = 'fullMoon' | 'season' | 'lunarEclipse' | 'solarEclipse'

export interface SkyEvent {
  id: SkyEventId
  date: Date
  /** i18n 키 `event.kinds.<kind>` */
  kind: string
}

const FULL_MOON_LONGITUDE = 180
const LUNAR_MONTH_SEARCH_DAYS = 40
const DAY_MS = 86_400_000

function nextSeason(date: Date): { date: Date; kind: string } {
  const year = date.getUTCFullYear()
  const candidates = [year, year + 1].flatMap((value) => {
    const seasons = Seasons(value)
    return [
      { date: seasons.mar_equinox.date, kind: 'marchEquinox' },
      { date: seasons.jun_solstice.date, kind: 'juneSolstice' },
      { date: seasons.sep_equinox.date, kind: 'septemberEquinox' },
      { date: seasons.dec_solstice.date, kind: 'decemberSolstice' },
    ]
  })
  return candidates.find((season) => season.date > date)!
}

/** date 이후 처음 오는 보름달, 절기, 월식, 일식을 빠른 순서로 돌려줍니다. */
export function upcomingSkyEvents(date: Date): SkyEvent[] {
  const fullMoon = SearchMoonPhase(FULL_MOON_LONGITUDE, date, LUNAR_MONTH_SEARCH_DAYS)
  const season = nextSeason(date)
  const lunar = SearchLunarEclipse(date)
  const solar = SearchGlobalSolarEclipse(date)
  const events: SkyEvent[] = [
    { id: 'season', date: season.date, kind: season.kind },
    { id: 'lunarEclipse', date: lunar.peak.date, kind: lunar.kind },
    { id: 'solarEclipse', date: solar.peak.date, kind: solar.kind },
  ]
  if (fullMoon) events.push({ id: 'fullMoon', date: fullMoon.date, kind: 'fullMoon' })
  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** 달력 날짜(UTC) 기준으로 남은 날수를 셉니다. */
export function daysUntil(target: Date, now: Date): number {
  const dayOf = (value: Date): number => Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  return Math.round((dayOf(target) - dayOf(now)) / DAY_MS)
}
