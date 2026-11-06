/** 위도·경도를 십진수 고정 소수점과 반구 기호로 표시합니다. */
export function formatLatitude(deg: number): string {
  return `${Math.abs(deg).toFixed(3)}° ${deg >= 0 ? 'N' : 'S'}`
}

export function formatLongitude(deg: number): string {
  return `${Math.abs(deg).toFixed(3)}° ${deg >= 0 ? 'E' : 'W'}`
}

/** 위도·경도를 도·분·초로 표시합니다. */
export function formatDms(deg: number, positive: string, negative: string): string {
  const absolute = Math.abs(deg)
  const d = Math.floor(absolute)
  const minutes = (absolute - d) * 60
  const m = Math.floor(minutes)
  const s = Math.floor((minutes - m) * 60)
  return `${String(d).padStart(positive === 'E' ? 3 : 2, '0')}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″${deg >= 0 ? positive : negative}`
}

export function formatUtc(date: Date, withDate = false): string {
  const iso = date.toISOString()
  return withDate ? `${iso.slice(0, 10)} ${iso.slice(11, 19)}Z` : `${iso.slice(11, 19)}Z`
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
