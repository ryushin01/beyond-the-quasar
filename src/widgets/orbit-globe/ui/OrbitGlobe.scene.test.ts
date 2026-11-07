import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FIXTURES } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'

import OrbitGlobe from './OrbitGlobe.vue'

// 렌더러 대신 호출만 기록하는 장면. jsdom에는 WebGL이 없어 실제 장면은 만들 수 없다.
const fake = vi.hoisted(() => {
  const scene = {
    setOrbits: vi.fn(),
    setPositions: vi.fn(),
    setColors: vi.fn(),
    setEarthRotation: vi.fn(),
    rotate: vi.fn(),
    zoom: vi.fn(),
    setAutoRotate: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  }
  return { scene, create: vi.fn(() => scene) }
})
vi.mock('../lib/scene', () => ({ createGlobeScene: fake.create }))

describe('OrbitGlobe와 장면', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
    for (const fn of Object.values(fake.scene)) fn.mockClear()
    fake.create.mockClear()
    // 모션이 켜진 환경으로 둔다.
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('매 초에는 위성 위치만 옮기고, 궤도선은 필터가 바뀔 때만 다시 만든다', async () => {
    const wrapper = mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(fake.scene.setOrbits).toHaveBeenCalledTimes(1)
    expect(fake.scene.setOrbits.mock.calls[0]![0]).toHaveLength(2)

    await vi.advanceTimersByTimeAsync(3000)
    expect(fake.scene.setPositions.mock.calls.length).toBeGreaterThanOrEqual(3)
    expect(fake.scene.setOrbits).toHaveBeenCalledTimes(1)

    useSatelliteFilter().toggleCategory('military')
    await flushPromises()
    expect(fake.scene.setOrbits).toHaveBeenCalledTimes(2)
    expect(fake.scene.setOrbits.mock.calls[1]![0]).toHaveLength(1)
    wrapper.unmount()
    expect(fake.scene.dispose).toHaveBeenCalled()
  })

  it('장면 파일을 받기 전에 화면을 떠나면 장면을 만들지 않는다', async () => {
    const wrapper = mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    wrapper.unmount()
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(fake.create).not.toHaveBeenCalled()
  })
})
