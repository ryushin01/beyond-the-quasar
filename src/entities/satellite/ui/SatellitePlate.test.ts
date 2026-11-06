import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { Satellite } from '../model/types'
import SatellitePlate from './SatellitePlate.vue'

const satellite: Satellite = { line1: '', line2: '', launchSite: null, launchDate: null, opsStatus: '+', periodMin: null, inclinationDeg: null, rcsM2: null, epoch: new Date(), objectId: null, noradId: 36868, name: 'AEHF-1', category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'US', dualUse: true, apogeeKm: 35800, perigeeKm: 35780 }

describe('SatellitePlate', () => {
  it('제목 안의 버튼 하나로 상세를 연다', async () => {
    const wrapper = mount(SatellitePlate, { props: { satellite } })
    const button = wrapper.get('h3 button')
    expect(button.attributes('aria-label')).toContain('AEHF-1')
    await button.trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  it('분류, 궤도, 운영 주체, 겸용 태그를 글자로 보여 준다', () => {
    const text = mount(SatellitePlate, { props: { satellite } }).text()
    for (const label of ['군사', 'GEO', '미국', '겸용', '군 위성통신', '35,790 km']) expect(text).toContain(label)
  })
})
