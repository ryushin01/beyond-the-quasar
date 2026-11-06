import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { Satellite } from '../model/types'
import SatelliteTags from './SatelliteTags.vue'

const satellite: Satellite = { line1: '', line2: '', launchSite: null, launchDate: null, opsStatus: '+', periodMin: null, inclinationDeg: null, rcsM2: null, epoch: new Date(), objectId: null, noradId: 1, name: 'X', category: 'military', mission: 'isr', orbit: 'LEO', owner: 'ZZZ', dualUse: false, apogeeKm: null, perigeeKm: null }

describe('SatelliteTags', () => {
  it('번역이 없는 운영 주체는 코드를 그대로 보여 준다', () => {
    expect(mount(SatelliteTags, { props: { satellite } }).text()).toContain('ZZZ')
  })

  it('inline이면 버튼에 넣을 수 있도록 span만 쓴다', () => {
    const wrapper = mount(SatelliteTags, { props: { satellite, inline: true } })
    expect(wrapper.find('ul, li').exists()).toBe(false)
    expect(wrapper.text()).toContain('군사')
  })

  it('compact에서는 운영 주체를 뺀다', () => {
    expect(mount(SatelliteTags, { props: { satellite, compact: true } }).text()).not.toContain('ZZZ')
  })
})
