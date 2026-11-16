import { beforeEach, describe, expect, it } from 'vitest'

import { isBoolean, isDateString, isFiniteNumber, isInteger, isOneOf, isRecordOf, isString, orNull, readStorage, readStorageList, writeStorage } from './storage'

beforeEach(() => localStorage.clear())

describe('readStorage', () => {
  it('값이 없으면 기본값', () => {
    expect(readStorage('k', 7)).toBe(7)
  })
  it('JSON이 아니면(손상) 기본값', () => {
    localStorage.setItem('k', '{not json')
    expect(readStorage('k', 7)).toBe(7)
  })
  it('검사를 통과하지 못하면(이전 버전 형식 등) 기본값', () => {
    localStorage.setItem('k', '"ISS"')
    expect(readStorage('k', 25544, isInteger)).toBe(25544)
    writeStorage('k', 20580)
    expect(readStorage('k', 25544, isInteger)).toBe(20580)
  })
})

describe('readStorageList', () => {
  it('배열이 아니면 빈 목록', () => {
    localStorage.setItem('list', '{"a":1}')
    expect(readStorageList('list', isInteger)).toEqual([])
  })
  it('형식이 맞는 항목만 남긴다(하나가 깨져도 나머지는 살림)', () => {
    localStorage.setItem('list', JSON.stringify([1, 'x', 2.5, null, 3]))
    expect(readStorageList('list', isInteger)).toEqual([1, 3])
  })
})

describe('검사 함수', () => {
  it('기본 형식', () => {
    expect(isBoolean(false)).toBe(true)
    expect(isBoolean('false')).toBe(false)
    expect(isString('')).toBe(true)
    expect(isFiniteNumber(Number.NaN)).toBe(false)
    expect(isDateString('2026-11-16T00:00:00.000Z')).toBe(true)
    expect(isDateString('어제')).toBe(false)
    expect(isOneOf(['ko', 'en'] as const)('fr')).toBe(false)
    expect(orNull(isInteger)(null)).toBe(true)
  })
  it('객체 필드를 모두 검사한다', () => {
    const isPoint = isRecordOf<{ x: number; label: string | null }>({ x: isFiniteNumber, label: orNull(isString) })
    expect(isPoint({ x: 1, label: null })).toBe(true)
    expect(isPoint({ x: 1 })).toBe(false)
    expect(isPoint({ x: '1', label: 'a' })).toBe(false)
    expect(isPoint(null)).toBe(false)
  })
})
