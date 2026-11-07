import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { AEHF_FIXTURE, ISS_FIXTURE } from '../model/fixtures'
import SatelliteWireframe from './SatelliteWireframe.vue'

describe('SatelliteWireframe', () => {
  it('실제 형상이 아니라는 설명을 글로 보여 주고 그림은 보조 기술에서 숨긴다', () => {
    const wrapper = mount(SatelliteWireframe, { props: { satellite: ISS_FIXTURE } })
    expect(wrapper.get('figcaption').text()).toContain('실제 형상 아님')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('군사 위성은 앰버로 구분하고 임무에 따라 형상이 달라진다', () => {
    const military = mount(SatelliteWireframe, { props: { satellite: AEHF_FIXTURE } })
    const crewed = mount(SatelliteWireframe, { props: { satellite: ISS_FIXTURE } })
    expect(military.get('figure').classes()).toContain('wire--military')
    expect(crewed.get('figure').classes()).not.toContain('wire--military')
    expect(military.get('path').attributes('d')).not.toBe(crewed.get('path').attributes('d'))
    military.unmount()
    crewed.unmount()
  })
})
