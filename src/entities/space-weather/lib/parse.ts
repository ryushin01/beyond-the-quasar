/** NOAA 우주 기상 등급(0~5). G: 지자기 폭풍, S: 태양 복사 폭풍, R: 전파 두절 */
export type ScaleKey = 'g' | 's' | 'r'

export interface ScaleNow {
  g: number
  s: number
  r: number
}

export interface DayForecast {
  /** YYYY-MM-DD (UTC) */
  date: string
  g: number | null
  /** R1~R2 확률(%) */
  rMinor: number | null
  /** R3 이상 확률(%) */
  rMajor: number | null
  /** S1 이상 확률(%) */
  s: number | null
}

export interface KpSample {
  time: Date
  kp: number
}

export interface SpaceWeather {
  observedAt: Date | null
  now: ScaleNow
  /** 지난 24시간 최대 등급 */
  past: ScaleNow | null
  /** 오늘부터 3일 예보 */
  forecast: DayForecast[]
  /** 3시간 간격 Kp 지수(오래된 순) */
  kp: KpSample[]
}

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)

/** "0"~"5" 같은 문자열·숫자를 0~5 정수로. 없거나 범위 밖이면 null */
function level(value: unknown): number | null {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : typeof value === 'number' ? value : Number.NaN
  return Number.isInteger(number) && number >= 0 && number <= 5 ? number : null
}

function percent(value: unknown): number | null {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null
}

function scaleOf(entry: unknown): ScaleNow | null {
  if (!isObject(entry)) return null
  const pick = (key: 'G' | 'S' | 'R') => (isObject(entry[key]) ? level((entry[key] as Json).Scale) : null)
  const g = pick('G')
  const s = pick('S')
  const r = pick('R')
  return g === null || s === null || r === null ? null : { g, s, r }
}

/** NOAA `noaa-scales.json`: "0"은 지금, "-1"은 지난 24시간 최대, "1"~"3"은 오늘부터 사흘 예보 */
export function parseScales(raw: unknown): Pick<SpaceWeather, 'observedAt' | 'now' | 'past' | 'forecast'> {
  if (!isObject(raw)) throw new Error('우주 기상 등급 응답 형식이 다릅니다')
  const now = scaleOf(raw['0'])
  if (!now) throw new Error('지금의 우주 기상 등급이 없습니다')
  const current = raw['0'] as Json
  const stamp = `${String(current.DateStamp ?? '')}T${String(current.TimeStamp ?? '')}Z`
  const observed = Date.parse(stamp)
  const forecast: DayForecast[] = []
  for (const key of ['1', '2', '3']) {
    const day = raw[key]
    if (!isObject(day)) continue
    const r = isObject(day.R) ? day.R : {}
    const s = isObject(day.S) ? day.S : {}
    const g = isObject(day.G) ? day.G : {}
    forecast.push({ date: String(day.DateStamp ?? ''), g: level(g.Scale), rMinor: percent(r.MinorProb), rMajor: percent(r.MajorProb), s: percent(s.Prob) })
  }
  return { observedAt: Number.isNaN(observed) ? null : new Date(observed), now, past: scaleOf(raw['-1']), forecast }
}

/** NOAA `noaa-planetary-k-index.json`. 객체 배열(현재)과 머리 행이 있는 배열의 배열(이전 형식)을 모두 받습니다. */
export function parseKp(raw: unknown): KpSample[] {
  if (!Array.isArray(raw)) throw new Error('Kp 응답 형식이 다릅니다')
  const toTime = (value: unknown): number => {
    const text = String(value ?? '').trim().replace(' ', 'T')
    return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text}Z`)
  }
  const samples: KpSample[] = []
  for (const row of raw) {
    const [time, kp] = Array.isArray(row) ? [row[0], row[1]] : isObject(row) ? [row.time_tag, row.Kp] : [undefined, undefined]
    const at = toTime(time)
    const value = Number(kp)
    // 머리 행("time_tag", "Kp")과 깨진 행은 건너뜁니다.
    if (Number.isNaN(at) || !Number.isFinite(value) || value < 0 || value > 9) continue
    samples.push({ time: new Date(at), kp: value })
  }
  return samples.sort((a, b) => a.time.getTime() - b.time.getTime())
}

/** Kp로 본 지자기 폭풍 등급(NOAA G 등급: Kp 5 = G1 … Kp 9 = G5) */
export function kpToG(kp: number): number {
  return Math.max(0, Math.min(5, Math.floor(kp) - 4))
}
