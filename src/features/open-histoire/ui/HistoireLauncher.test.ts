import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMotionPreference } from '@/shared/motion'

import HistoireLauncher from './HistoireLauncher.vue'

const HREF = '/histoire/index.html'

describe('HistoireLauncher', () => {
  const motion = useMotionPreference()

  afterEach(() => {
    if (motion.userPaused.value) motion.toggle()
  })

  it('실제 주소를 가진 링크이고 이름에 보이는 글자를 담는다', () => {
    const wrapper = mount(HistoireLauncher, { props: { href: HREF, navigate: vi.fn() } })
    expect(wrapper.get('a').attributes('href')).toBe(HREF)
    expect(wrapper.get('a').attributes('aria-label')).toContain('Histoire')
  })

  it('모션을 멈춘 사용자는 연출 없이 바로 이동한다', async () => {
    if (!motion.userPaused.value) motion.toggle()
    const navigate = vi.fn()
    const wrapper = mount(HistoireLauncher, { props: { href: HREF, navigate } })
    await wrapper.get('a').trigger('click', { button: 0 })
    expect(navigate).toHaveBeenCalledWith(HREF)
    expect(wrapper.find('.warp').exists()).toBe(false)
  })

  it('수정 키를 누른 클릭은 브라우저에 맡긴다', async () => {
    const navigate = vi.fn()
    const wrapper = mount(HistoireLauncher, { props: { href: HREF, navigate } })
    const event = new MouseEvent('click', { button: 0, metaKey: true, cancelable: true, bubbles: true })
    wrapper.get('a').element.dispatchEvent(event)
    await flushPromises()
    expect(event.defaultPrevented).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('여러 번 눌러도 전환은 한 번만 시작한다', async () => {
    const wrapper = mount(HistoireLauncher, { props: { href: HREF, navigate: vi.fn() } })
    const link = wrapper.get('a')
    await link.trigger('click', { button: 0 })
    await link.trigger('click', { button: 0 })
    await flushPromises()
    expect(wrapper.findAll('.warp')).toHaveLength(1)
    wrapper.unmount()
  })
})
