/** 주소로 받을 수 있는 관측 시각의 범위. 계산 라이브러리가 정확한 범위 안에서만 받습니다. */
const MIN_TIME = Date.UTC(1900, 0, 1)
const MAX_TIME = Date.UTC(2100, 0, 1)
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?Z$/

/** `?at=` 값을 검사해 시각으로 바꿉니다. 형식이 다르거나 범위를 벗어나면 null입니다. */
export function parsePinnedTime(value: unknown): Date | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !ISO_PATTERN.test(raw)) return null
  const time = Date.parse(raw)
  if (Number.isNaN(time) || time < MIN_TIME || time >= MAX_TIME) return null
  return new Date(time)
}
