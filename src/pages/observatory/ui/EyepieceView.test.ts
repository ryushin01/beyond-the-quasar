import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EyepieceView from './EyepieceView.vue'

const SOLAR = { tracked: { x: 0, y: 0, radius: 0.27 }, occluder: { x: 0.1, y: 0, radius: 0.26 }, umbra: null, penumbra: null, altitude: 40 }
const LUNAR = { tracked: { x: 0, y: 0, radius: 0.26 }, occluder: null, umbra: { x: 0.5, y: 0.2, radius: 0.7 }, penumbra: { x: 0.5, y: 0.2, radius: 1.25 }, altitude: -5 }

describe('EyepieceView', () => {
  it('일식은 해 위에 달을 겹쳐 그린다', () => {
    const wrapper = mount(EyepieceView, { props: { id: 'solarEclipse', scene: SOLAR } })
    expect(wrapper.find('circle[fill="url(#eyepiece-sun)"]').exists()).toBe(true)
    expect(wrapper.find('circle[fill="#030303"]').attributes('cx')).toBe(String(0.1 * (2 / 1.6)))
    expect(wrapper.text()).not.toContain('지평선 아래')
  })

  it('월식은 달 위에 그림자를 그리고, 지평선 아래면 알린다', () => {
    const wrapper = mount(EyepieceView, { props: { id: 'lunarEclipse', scene: LUNAR } })
    expect(wrapper.find('circle[fill="url(#eyepiece-moon)"]').exists()).toBe(true)
    expect(wrapper.findAll('.eyepiece__shadow-edge')).toHaveLength(2)
    expect(wrapper.text()).toContain('지평선 아래')
  })
})
