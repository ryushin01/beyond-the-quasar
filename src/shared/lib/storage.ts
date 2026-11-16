/** 저장된 값이 기대한 형식인지 확인하는 함수 */
export type StorageGuard<T> = (value: unknown) => value is T

/**
 * 저장된 값을 읽습니다. 저장소를 쓸 수 없는 환경에서도 앱이 동작하도록 예외를 삼킵니다.
 * 값이 없거나, JSON이 아니거나, `isValid`를 통과하지 못하면(손상, 이전 버전의 형식) `fallback`을 돌려줍니다.
 */
export function readStorage<T>(key: string, fallback: T, isValid?: StorageGuard<T>): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return !isValid || isValid(value) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

/** 목록 값을 읽습니다. 배열이 아니면 빈 목록, 배열이면 형식이 맞는 항목만 남깁니다(하나가 깨져도 나머지는 살림). */
export function readStorageList<T>(key: string, isItem: StorageGuard<T>): T[] {
  const value = readStorage<unknown>(key, [])
  return Array.isArray(value) ? value.filter(isItem) : []
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 사생활 보호 모드 등에서는 저장하지 않습니다.
  }
}

export const isBoolean: StorageGuard<boolean> = (value): value is boolean => typeof value === 'boolean'
export const isInteger: StorageGuard<number> = (value): value is number => Number.isInteger(value)
export const isString: StorageGuard<string> = (value): value is string => typeof value === 'string'
export const isFiniteNumber: StorageGuard<number> = (value): value is number => typeof value === 'number' && Number.isFinite(value)

/** 허용 목록 중 하나인 문자열 */
export const isOneOf =
  <T extends string>(list: readonly T[]): StorageGuard<T> =>
  (value): value is T =>
    typeof value === 'string' && (list as readonly string[]).includes(value)

/** 날짜로 읽을 수 있는 ISO 문자열 */
export const isDateString: StorageGuard<string> = (value): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))

/** 객체이고 각 필드가 검사를 통과하는지 */
export function isRecordOf<T>(fields: { [K in keyof T]: StorageGuard<T[K]> }): StorageGuard<T> {
  return (value): value is T =>
    typeof value === 'object' &&
    value !== null &&
    Object.entries(fields).every(([key, guard]) => (guard as StorageGuard<unknown>)((value as Record<string, unknown>)[key]))
}

/** null도 허용 */
export const orNull =
  <T>(guard: StorageGuard<T>): StorageGuard<T | null> =>
  (value): value is T | null =>
    value === null || guard(value)
