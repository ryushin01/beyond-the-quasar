import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'
import { createRecordingContext, fingerprint } from '@/shared/lib/test/recording-canvas'

import GroundTrackMap from './GroundTrackMap.vue'

/** 관찰을 시작하자마자 정한 크기를 알려 주는 ResizeObserver(jsdom에는 배치가 없음) */
class SizedResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element): void {
    this.callback([{ target, contentRect: { width: 960, height: 520 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve(): void {}
  disconnect(): void {}
}

describe('GroundTrackMap 그리기', () => {
  const original = globalThis.ResizeObserver

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
    globalThis.ResizeObserver = SizedResizeObserver as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    globalThis.ResizeObserver = original
    vi.restoreAllMocks()
  })

  // 그리는 코드를 나누거나 정리해도 같은 지도를 그리는지 지킵니다. 그림을 일부러 바꿨다면 지문을 갱신합니다.
  it('평면 지도·지구본·확대를 같은 호출로 그리고, 추적 표식을 같은 자리에 둔다', async () => {
    const { context, calls } = createRecordingContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never)
    const wrapper = mount(GroundTrackMap, { props: { satellites: FIXTURES, tracked: ISS_FIXTURE } })
    await flushPromises()
    expect(fingerprint(calls)).toMatchInlineSnapshot(`
      {
        "calls": 9013,
        "sha256": "45242f53c0ed9d21",
      }
    `)
    expect(wrapper.get('.map__marker').attributes('style')).toMatchInlineSnapshot(`"display: block; transform: translate(668.325px, 103.977px);"`)

    calls.length = 0
    await wrapper.get('button[aria-label="지도 확대"]').trigger('click')
    expect(fingerprint(calls)).toMatchInlineSnapshot(`
      {
        "calls": 9209,
        "sha256": "5e6b01cc2db0621f",
      }
    `)

    calls.length = 0
    await wrapper.findAll('button').find((button) => button.text() === '지구본')!.trigger('click')
    expect(fingerprint(calls)).toMatchInlineSnapshot(`
      {
        "calls": 17624,
        "sha256": "b17ec4bcb30c9474",
      }
    `)
    expect(wrapper.get('.map__marker').attributes('style')).toMatchInlineSnapshot(`"display: block; transform: translate(480px, 193.951px);"`)
    wrapper.unmount()
  })

  it('그려진 위성 가까이 포인터를 두면 이름을 띄우고, 누르면 그 위성을 고른다', async () => {
    const { context, calls } = createRecordingContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never)
    const tracked = FIXTURES.find((satellite) => satellite.category === 'military') ?? ISS_FIXTURE
    const wrapper = mount(GroundTrackMap, { props: { satellites: FIXTURES, tracked } })
    await flushPromises()

    // 추적하지 않는 위성은 반지름 2의 원(군사는 마름모)으로 그립니다. 그 자리를 찾아 포인터를 둡니다.
    const dot = calls.map((call) => /^arc\(([-\d.]+),([-\d.]+),2,0,6\.283\)$/.exec(call)).find(Boolean)
    expect(dot).toBeTruthy()
    const [x, y] = [Number(dot![1]) + 3, Number(dot![2]) - 2]
    const other = FIXTURES.find((satellite) => satellite.noradId !== tracked.noradId && satellite.category !== 'military')!

    const canvas = wrapper.get('canvas')
    await canvas.trigger('mousemove', { clientX: x, clientY: y })
    expect(wrapper.get('.map__tip').text()).toBe(other.name)
    await canvas.trigger('click', { clientX: x, clientY: y })
    expect(wrapper.emitted('select')).toEqual([[other.noradId]])

    await canvas.trigger('mousemove', { clientX: x + 40, clientY: y + 40 })
    expect(wrapper.find('.map__tip').exists()).toBe(false)
    wrapper.unmount()
  })
})
