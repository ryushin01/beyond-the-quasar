import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useObserver } from '@/entities/observer'

import SiteSelect from './SiteSelect.vue'

function stubGeolocation(result: { coords: { latitude: number; longitude: number } } | 'denied') {
  const getCurrentPosition = vi.fn((success: PositionCallback, failure: PositionErrorCallback) => {
    if (result === 'denied') failure({ code: 1, message: 'denied' } as GeolocationPositionError)
    else success(result as unknown as GeolocationPosition)
  })
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } })
  return getCurrentPosition
}

describe('SiteSelect', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(navigator, 'geolocation')
  })

  it('레이블과 선택된 관측지를 보여 준다', () => {
    const wrapper = mount(SiteSelect, { props: { label: '지상국' } })
    expect(wrapper.text()).toContain('지상국')
    expect(wrapper.text()).toContain('대전')
  })

  it("'현재 위치'를 고르면 브라우저 위치를 소수 둘째 자리로 줄여 관측지로 쓴다", async () => {
    const locate = stubGeolocation({ coords: { latitude: 37.566535, longitude: 126.977969 } })
    const wrapper = mount(SiteSelect, { props: { label: '지상국' } })
    wrapper.getComponent({ name: 'QSelect' }).vm.$emit('update:modelValue', 'here')
    await flushPromises()
    expect(locate).toHaveBeenCalledOnce()
    const observer = useObserver()
    expect(observer.siteId).toBe('here')
    expect(observer.site).toMatchObject({ id: 'here', latitude: 37.57, longitude: 126.98 })
    expect(JSON.parse(localStorage.getItem('btq:here')!)).toEqual({ latitude: 37.57, longitude: 126.98 })
  })

  it('위치를 기다리는 사이 다른 관측지를 고르면, 늦게 온 위치가 그 선택을 덮어쓰지 않는다', async () => {
    let answer!: PositionCallback
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (success: PositionCallback) => (answer = success) },
    })
    const wrapper = mount(SiteSelect, { props: { label: '지상국' } })
    const select = wrapper.getComponent({ name: 'QSelect' })
    select.vm.$emit('update:modelValue', 'here')
    select.vm.$emit('update:modelValue', 'seoul')
    answer({ coords: { latitude: 10, longitude: 20 } } as unknown as GeolocationPosition)
    await flushPromises()
    expect(useObserver().siteId).toBe('seoul')
  })

  it('기다리는 사이 선택 컴포넌트가 사라지면 늦게 온 위치를 버린다', async () => {
    let answer!: PositionCallback
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (success: PositionCallback) => (answer = success) },
    })
    const first = mount(SiteSelect, { props: { label: '지상국' } })
    first.getComponent({ name: 'QSelect' }).vm.$emit('update:modelValue', 'here')
    first.unmount()
    // 다른 화면의 선택 컴포넌트에서 서울을 고른 뒤에 첫 요청의 위치가 도착
    const second = mount(SiteSelect, { props: { label: '지상국' } })
    second.getComponent({ name: 'QSelect' }).vm.$emit('update:modelValue', 'seoul')
    answer({ coords: { latitude: 10, longitude: 20 } } as unknown as GeolocationPosition)
    await flushPromises()
    expect(useObserver().siteId).toBe('seoul')
  })

  it('위치를 거부하면 이전 관측지를 그대로 두고 알린다', async () => {
    stubGeolocation('denied')
    const wrapper = mount(SiteSelect, { props: { label: '지상국' }, attachTo: document.body })
    wrapper.getComponent({ name: 'QSelect' }).vm.$emit('update:modelValue', 'here')
    await flushPromises()
    expect(useObserver().siteId).toBe('daejeon')
    await vi.waitFor(() => expect(document.body.textContent).toContain('위치를 받지 못해 이전 관측지를 그대로 씁니다'))
    wrapper.unmount()
  })
})

describe('useObserver', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it("저장된 '현재 위치'가 없는데 번호만 'here'면 기본 관측지로 시작한다", () => {
    localStorage.setItem('btq:site', '"here"')
    expect(useObserver().siteId).toBe('daejeon')
  })

  it("저장된 '현재 위치'가 있으면 그 좌표로 다시 시작하고, 범위 밖 좌표는 버린다", () => {
    localStorage.setItem('btq:site', '"here"')
    localStorage.setItem('btq:here', '{"latitude":37.57,"longitude":126.98}')
    expect(useObserver().site).toMatchObject({ id: 'here', latitude: 37.57 })
    setActivePinia(createPinia())
    localStorage.setItem('btq:here', '{"latitude":137,"longitude":126.98}')
    expect(useObserver().siteId).toBe('daejeon')
  })
})
