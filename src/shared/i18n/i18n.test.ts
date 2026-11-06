import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

// 플러그인이 컴파일하기 전의 원본 JSON을 비교합니다.
const read = (locale: string): object =>
  JSON.parse(readFileSync(resolve(process.cwd(), `src/shared/i18n/locales/${locale}.json`), 'utf8')) as object

function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' ? keysOf(child as object, `${prefix}${key}.`) : [`${prefix}${key}`],
  )
}

describe('번역 파일', () => {
  it('한국어와 영어의 키가 같다', () => {
    expect(keysOf(read('ko')).sort()).toEqual(keysOf(read('en')).sort())
  })
})
