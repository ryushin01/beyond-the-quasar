/** 저장소를 쓸 수 없는 환경에서도 앱이 동작하도록 예외를 삼킵니다. */
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 사생활 보호 모드 등에서는 저장하지 않습니다.
  }
}
