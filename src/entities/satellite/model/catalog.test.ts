import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { useSatelliteCatalog } from './catalog'

const snapshot = {
  fetchedAt: '2026-11-15T00:00:00.000Z',
  source: 'test',
  satellites: [
    {
      noradId: 25544,
      name: 'ISS (ZARYA)',
      line1: '1 25544U 98067A   26319.50000000  .00016717  00000-0  10270-3 0  9005',
      line2: '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.49560830 11112',
      category: 'crewed',
      mission: 'crewed',
      owner: 'ISS',
      dualUse: false,
      objectId: '1998-067A',
      launchDate: '1998-11-20',
      launchSite: 'TYMSC',
      opsStatus: '+',
      periodMin: 92.9,
      inclinationDeg: 51.64,
      apogeeKm: 420,
      perigeeKm: 415,
      rcsM2: null,
    },
  ],
}

function mountCatalog(client: QueryClient) {
  let catalog!: ReturnType<typeof useSatelliteCatalog>
  mount(
    defineComponent({
      setup() {
        catalog = useSatelliteCatalog()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } },
  )
  return () => catalog
}

describe('useSatelliteCatalog', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('처음 받기가 실패하면 오류로 알린다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const catalog = mountCatalog(client)
    await flushPromises()
    expect(catalog().isError.value).toBe(true)
    expect(catalog().satellites.value).toEqual([])
  })

  it('받은 뒤 다시 받기가 실패해도 받아 둔 스냅샷을 계속 보여 주고 오류 화면으로 바꾸지 않는다', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(snapshot), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const catalog = mountCatalog(client)
    await flushPromises()
    expect(catalog().satellites.value).toHaveLength(1)

    fetch.mockImplementation(async () => new Response('', { status: 503 }))
    await catalog().refetch()
    await flushPromises()
    expect(catalog().isError.value).toBe(false)
    expect(catalog().satellites.value).toHaveLength(1)
  })
})
