import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import HomeProgress from './HomeProgress.vue'

const STOPS = [
  { id: 'stop-a', label: '첫째' },
  { id: 'stop-b', label: '둘째' },
]

function addSection(id: string, top: number, height: number): HTMLElement {
  const element = document.createElement('div')
  element.id = id
  element.tabIndex = -1
  element.getBoundingClientRect = () => ({ top, height }) as DOMRect
  document.body.append(element)
  return element
}

describe('HomeProgress', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('구역을 순서 있는 링크 목록으로 제공한다', () => {
    const wrapper = mount(HomeProgress, { props: { stops: STOPS } })
    expect(wrapper.get('nav').attributes('aria-label')).toBe('홈 구역 진행')
    expect(wrapper.findAll('ol > li > a').map((link) => link.attributes('href'))).toEqual(['#stop-a', '#stop-b'])
    wrapper.unmount()
  })

  it('현재 구역을 표시하고 채움 정도를 넘긴다', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    addSection('stop-a', -window.innerHeight, window.innerHeight)
    addSection('stop-b', 0, window.innerHeight)
    const wrapper = mount(HomeProgress, { props: { stops: STOPS } })
    await wrapper.vm.$nextTick()
    const links = wrapper.findAll('a')
    expect(links[0]!.attributes('aria-current')).toBeUndefined()
    expect(links[1]!.attributes('aria-current')).toBe('location')
    expect(links[1]!.get('.progress__fill').attributes('style')).toContain('--fill: 0.5')
    expect(wrapper.get('nav').classes()).toContain('progress--shown')
    wrapper.unmount()
  })

  it('링크를 누르면 해당 구역으로 이동하고 초점을 옮긴다', async () => {
    const target = addSection('stop-b', 300, 100)
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const wrapper = mount(HomeProgress, { props: { stops: STOPS } })
    await wrapper.findAll('a')[1]!.trigger('click')
    expect(scroll).toHaveBeenCalledWith(0, 300)
    expect(document.activeElement).toBe(target)
    wrapper.unmount()
  })
})
