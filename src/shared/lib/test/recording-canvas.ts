import { createHash } from 'node:crypto'

/**
 * 캔버스 2D 호출과 속성 설정을 순서대로 적는 가짜 문맥입니다.
 * 그리는 코드를 나누거나 정리한 뒤에도 같은 그림을 그리는지 지문(fingerprint)으로 비교합니다.
 * 숫자는 소수 셋째 자리로 반올림해 기계마다 다른 부동소수 끝자리를 지웁니다.
 */
export function createRecordingContext(): { context: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = []
  const state: Record<string, unknown> = {}
  const format = (value: unknown): string => JSON.stringify(value, (_key, item: unknown) => (typeof item === 'number' ? Math.round(item * 1000) / 1000 : item))
  const context = new Proxy(state, {
    get(target, key) {
      if (typeof key === 'symbol') return undefined
      if (key in target) return target[key]
      // 글자 폭은 글자 수에 비례한다고 둡니다(jsdom에는 글꼴이 없음).
      if (key === 'measureText') return (text: string) => ({ width: text.length * 7 })
      return (...args: unknown[]) => {
        calls.push(`${key}(${args.map(format).join(',')})`)
      }
    },
    set(target, key, value: unknown) {
      if (typeof key === 'symbol') return false
      target[key] = value
      calls.push(`${key}=${format(value)}`)
      return true
    },
  })
  return { context: context as unknown as CanvasRenderingContext2D, calls }
}

/** 호출 기록을 짧은 지문으로 줄입니다. 의도해서 그림을 바꿨다면 `vitest -u`로 갱신합니다. */
export function fingerprint(calls: readonly string[]): { calls: number; sha256: string } {
  return { calls: calls.length, sha256: createHash('sha256').update(calls.join('\n')).digest('hex').slice(0, 16) }
}
