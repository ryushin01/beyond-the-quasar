import { describe, expect, it } from 'vitest'

import { AEHF_FIXTURE } from '../model/fixtures'
import type { Pass } from '../model/types'
import { stateAt, toSatrec } from './orbit'
import { isSunlit, isVisiblePass, sunAltitude } from './visibility'

const geo = toSatrec(AEHF_FIXTURE.line1, AEHF_FIXTURE.line2)
const daejeon = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const scan = (start: string, hours: number, stepMin: number) =>
  Array.from({ length: (hours * 60) / stepMin }, (_, index) => new Date(Date.parse(start) + index * stepMin * 60_000))
const passAt = (maxAt: Date): Pass => ({ aos: maxAt, los: maxAt, maxAt, maxElevation: 40, aosAzimuth: 0, losAzimuth: 0 })

describe('위성 그림자', () => {
  it('정지궤도 위성은 춘분 무렵 하루에 한 번(자정 근처, 1시간 남짓) 지구 그림자에 들어간다', () => {
    const shadow = scan('2026-03-20T00:00:00Z', 24, 5).filter((date) => isSunlit(geo, date) === false)
    expect(shadow.length).toBeGreaterThan(6)
    expect(shadow.length).toBeLessThan(20)
    // 한 덩어리로 이어진 구간
    expect(shadow.at(-1)!.getTime() - shadow[0]!.getTime()).toBeLessThan(2 * 3_600_000)
  })

  it('하지에는 정지궤도 위성이 하루 내내 햇빛을 받는다', () => {
    expect(scan('2026-06-21T00:00:00Z', 24, 10).every((date) => isSunlit(geo, date) === true)).toBe(true)
  })
})

describe('관측지의 해 고도', () => {
  it('대전 정오(03Z)에는 해가 떠 있고 자정(15Z)에는 지평선 아래 깊이 있다', () => {
    expect(sunAltitude(daejeon, new Date('2026-11-16T03:00:00Z'))).toBeGreaterThan(20)
    expect(sunAltitude(daejeon, new Date('2026-11-16T15:00:00Z'))).toBeLessThan(-30)
  })
})

describe('맨눈 통과', () => {
  it('관측지가 어둡고 위성이 햇빛을 받으면 보인다', () => {
    expect(isVisiblePass(geo, passAt(new Date('2026-06-21T15:00:00Z')), daejeon)).toBe(true)
  })

  it('낮에는 보이지 않는다', () => {
    expect(isVisiblePass(geo, passAt(new Date('2026-06-21T03:00:00Z')), daejeon)).toBe(false)
  })

  it('위성이 지구 그림자 안에 있으면 하늘이 어두워도 보이지 않는다', () => {
    const shadowed = scan('2026-03-20T00:00:00Z', 24, 5).find((date) => isSunlit(geo, date) === false)!
    // 위성 바로 아래 지점은 그 순간 한밤중입니다.
    const below = stateAt(geo, shadowed)!
    const site = { latitude: below.latitude, longitude: below.longitude, elevationM: 0 }
    expect(sunAltitude(site, shadowed)).toBeLessThan(-6)
    expect(isVisiblePass(geo, passAt(shadowed), site)).toBe(false)
  })
})
