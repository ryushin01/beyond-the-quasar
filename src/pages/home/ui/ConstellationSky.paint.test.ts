import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createRecordingContext, fingerprint } from '@/shared/lib/test/recording-canvas'

import ConstellationSky from './ConstellationSky.vue'

function setCanvasSize(width: number, height: number): void {
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { configurable: true, get: () => height })
}

describe('ConstellationSky 그리기', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver ||= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientWidth')
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientHeight')
  })

  // 그리는 코드를 나누거나 정리해도 같은 하늘을 그리는지 지킵니다. 그림을 일부러 바꿨다면 지문을 갱신합니다.
  it('같은 시각·관측지·크기에서 같은 하늘을 그리고, 끌면 그 방향으로 다시 그린다', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-20T12:00:00Z'), toFake: ['Date'] })
    vi.spyOn(performance, 'now').mockReturnValue(1234)
    const { context, calls } = createRecordingContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never)
    setCanvasSize(1280, 720)

    const wrapper = mount(ConstellationSky, { global: { plugins: [createPinia()], stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    expect(fingerprint(calls)).toMatchInlineSnapshot(`
      {
        "calls": 1299,
        "sha256": "62004b33549c1211",
      }
    `)

    calls.length = 0
    const canvas = wrapper.get('canvas')
    await canvas.trigger('pointerdown', { button: 0, pointerId: 1, clientX: 400 })
    await canvas.trigger('pointermove', { pointerId: 1, clientX: 520 })
    await canvas.trigger('pointerup', { pointerId: 1 })
    await canvas.trigger('pointermove', { pointerId: 1, clientX: 700 })
    expect(fingerprint(calls)).toMatchInlineSnapshot(`
      {
        "calls": 1348,
        "sha256": "df258cbe91eed36a",
      }
    `)
    wrapper.unmount()
  })
})
