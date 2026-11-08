import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { ScrollTrigger } from './gsap'
import { useRefreshOnDocumentWidth } from './refresh-on-width'

let notify: () => void = () => {}
const original = globalThis.ResizeObserver

function setWidth(width: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: width })
}

describe('useRefreshOnDocumentWidth', () => {
  afterEach(() => {
    globalThis.ResizeObserver = original
    vi.restoreAllMocks()
  })

  it('문서 폭이 바뀔 때만 다시 계산한다', () => {
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        notify = () => callback([], this as unknown as ResizeObserver)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
    const refresh = vi.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {})
    setWidth(1425)
    const wrapper = mount(defineComponent({ setup: () => (useRefreshOnDocumentWidth(), () => h('div')) }))

    notify()
    expect(refresh).not.toHaveBeenCalled()
    setWidth(1440)
    notify()
    expect(refresh).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
