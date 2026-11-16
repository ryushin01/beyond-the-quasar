import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SpaceHazards from './SpaceHazards.vue'

const scales = {
  '0': { DateStamp: '2026-11-16', TimeStamp: '02:19:00', R: { Scale: '0' }, S: { Scale: '0' }, G: { Scale: '2' } },
  '1': { DateStamp: '2026-11-16', TimeStamp: '02:19:00', R: { Scale: null, MinorProb: '25', MajorProb: '5' }, S: { Scale: null, Prob: '5' }, G: { Scale: '2' } },
  '2': { DateStamp: '2026-11-17', TimeStamp: '00:00:00', R: { Scale: null, MinorProb: '20', MajorProb: '5' }, S: { Scale: null, Prob: '1' }, G: { Scale: '3' } },
}
const kp = Array.from({ length: 8 }, (_, index) => ({ time_tag: `2026-11-15T${String(index * 3).padStart(2, '0')}:00:00`, Kp: index === 7 ? 6.33 : 2 }))
const neo = {
  fetchedAt: '2026-11-16T02:23:10.874Z',
  source: 'NASA/JPL SBDB Close Approach Data API',
  approaches: [
    { designation: 'past', name: '(past)', date: '2026-11-10T00:00:00.000Z', distanceAu: 0.01, velocityKmS: 5, absoluteMagnitude: 27 },
    { designation: '2026 VJ13', name: '(2026 VJ13)', date: '2026-11-17T05:36:00.000Z', distanceAu: 0.009, velocityKmS: 10.44, absoluteMagnitude: 27.25 },
    { designation: '2026 XX1', name: '(2026 XX1)', date: '2026-11-20T00:00:00.000Z', distanceAu: 0.0015, velocityKmS: 12, absoluteMagnitude: 22 },
  ],
}

function respond(url: string): Response {
  if (url.includes('noaa-scales')) return new Response(JSON.stringify(scales))
  if (url.includes('planetary-k-index')) return new Response(JSON.stringify(kp))
  if (url.includes('neo-snapshot')) return new Response(JSON.stringify(neo))
  return new Response('', { status: 404 })
}

function mountHazards() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(SpaceHazards, {
    props: { now: new Date('2026-11-16T03:00:00Z') },
    global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
  })
}

describe('SpaceHazards', () => {
  beforeEach(() => {
    // 패널이 화면에 들어온 상황
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback([{ isIntersecting: true, target, time: 1 } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        unobserve() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('우주 기상 등급과 Kp, 앞으로의 소행성 접근을 보여 준다', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => respond(url)))
    const wrapper = mountHazards()
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('G2')
    expect(text).toContain('사흘 예보 최대 G3')
    expect(text).toContain('오늘 R1–2 25% · R3 이상 5%')
    expect(text).toContain('6.3')
    // 지난 접근은 빼고 날짜순
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('2026-11-17 05:36Z')
    // 달보다 가까운 접근(0.0015 AU ≈ 0.6 LD)은 앰버로 표시
    expect(rows[1]!.find('.table__alert').exists()).toBe(true)
    expect(rows[1]!.text()).toContain('달보다 가까움')
    // 등급 1 이상은 앰버
    expect(wrapper.find('.hazards__value--alert').exists()).toBe(true)
  })

  it('우주 기상을 받지 못하면 그 영역에만 안내와 다시 시도 버튼을 보이고, 소행성 표는 그대로 둔다', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('noaa') ? new Response('', { status: 503 }) : respond(url))))
    const wrapper = mountHazards()
    // 우주 기상은 한 번 다시 시도(1초 뒤)한 뒤에 실패로 봅니다.
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true), { timeout: 4000 })
    expect(wrapper.find('[role="alert"]').text()).toContain('우주 기상을 불러오지 못했습니다')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('화면에 들어오기 전에는 외부 자료를 받지 않는다', async () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const fetch = vi.fn(async (url: string) => respond(url))
    vi.stubGlobal('fetch', fetch)
    mountHazards()
    await flushPromises()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("예보 값이 없으면 'G0'이 아니라 '—'로 보인다", async () => {
    const noForecast = { ...scales, '1': { ...scales['1'], G: { Scale: null } }, '2': { ...scales['2'], G: { Scale: null } } }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.includes('noaa-scales') ? new Response(JSON.stringify(noForecast)) : respond(url))))
    const wrapper = mountHazards()
    await flushPromises()
    expect(wrapper.text()).toContain('사흘 예보 최대 G—')
  })

  it('화면을 열어 둔 채 접근 시각이 지나면 목록에서 빠진다', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(new Date('2026-11-17T05:00:00Z'))
    try {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => respond(url)))
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const wrapper = mount(SpaceHazards, { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } })
      await vi.waitFor(() => expect(wrapper.findAll('tbody tr')).toHaveLength(2))
      // 05:36Z 접근이 지나도록 40분 흘려 보냅니다(1분마다 시각 갱신).
      vi.setSystemTime(new Date('2026-11-17T05:40:00Z'))
      vi.advanceTimersByTime(60_000)
      await flushPromises()
      expect(wrapper.findAll('tbody tr')).toHaveLength(1)
      expect(wrapper.find('tbody tr').text()).toContain('2026 XX1')
    } finally {
      vi.useRealTimers()
    }
  })
})
