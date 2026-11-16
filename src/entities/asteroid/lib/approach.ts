export const AU_KM = 149_597_870.7
/** 지구-달 평균 거리(km). 근접 접근 거리를 '달 거리(LD)'의 배수로 보일 때 씁니다. */
export const LUNAR_DISTANCE_KM = 384_400

export interface CloseApproach {
  /** 임시 명칭 또는 번호 */
  designation: string
  name: string
  date: Date
  distanceAu: number
  /** 지구에 대한 상대 속도(km/s) */
  velocityKmS: number
  /** 절대 등급 H. 작을수록 큽니다. */
  absoluteMagnitude: number | null
}

export const toLunarDistances = (au: number): number => (au * AU_KM) / LUNAR_DISTANCE_KM

/**
 * 절대 등급(H)으로 지름 범위(m)를 어림합니다. 표면 반사율을 모르므로 밝은 표면(0.25)~어두운 표면(0.05)으로 잡습니다.
 * D(km) = 1329 / √반사율 × 10^(−H/5)
 */
export function estimateDiameterM(h: number): { min: number; max: number } {
  const diameter = (albedo: number) => (1329 / Math.sqrt(albedo)) * 10 ** (-h / 5) * 1000
  return { min: diameter(0.25), max: diameter(0.05) }
}

/** 지금 이후의 접근만 날짜순으로 */
export function upcomingApproaches(approaches: CloseApproach[], now: Date, limit = Number.POSITIVE_INFINITY): CloseApproach[] {
  return approaches
    .filter((item) => item.date.getTime() >= now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit)
}

/** 스냅샷의 접근 한 줄을 앱 형식으로. 형식이 다르면 null(그 줄만 버림) */
export function toCloseApproach(raw: unknown): CloseApproach | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  const date = typeof record.date === 'string' ? new Date(record.date) : null
  const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)
  const distanceAu = number(record.distanceAu)
  const velocityKmS = number(record.velocityKmS)
  if (!date || Number.isNaN(date.getTime()) || distanceAu === null || velocityKmS === null || typeof record.designation !== 'string') return null
  return {
    designation: record.designation,
    name: typeof record.name === 'string' && record.name ? record.name : record.designation,
    date,
    distanceAu,
    velocityKmS,
    absoluteMagnitude: number(record.absoluteMagnitude),
  }
}
