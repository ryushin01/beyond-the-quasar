import { canvasPrint } from '../../../../cypress/support/canvas'

import { defineComponent, h } from 'vue'

import ConstellationSky from './ConstellationSky.vue'

const RouterLink = defineComponent({ props: { to: { type: [String, Object], required: true } }, setup: (_, { slots }) => () => h('a', { href: '#' }, slots.default?.()) })
const mountSky = () => cy.mount(ConstellationSky, { global: { stubs: { RouterLink } } })

// jsdom은 2D 캔버스를 그리지 못하므로 실제 브라우저에서 하늘이 그려지고 조작에 따라 바뀌는지 봅니다.
describe('ConstellationSky (실제 브라우저)', () => {
  it('별과 별자리선을 그린다', () => {
    mountSky()
    cy.get('canvas[role="img"]').should(($canvas) => {
      expect(canvasPrint($canvas[0] as HTMLCanvasElement).painted).to.be.greaterThan(2000)
    })
  })


  it('가로로 끌면 하늘이 돌아간다', () => {
    mountSky()
    cy.get('canvas[role="img"]').then(($canvas) => {
      const first = canvasPrint($canvas[0] as HTMLCanvasElement).hash
      cy.get('canvas[role="img"]')
        .trigger('pointerdown', 500, 300, { pointerId: 1, button: 0 })
        .trigger('pointermove', 700, 300, { pointerId: 1 })
        .trigger('pointerup', 700, 300, { pointerId: 1 })
      cy.get('canvas[role="img"]').should(($after) => {
        expect(canvasPrint($after[0] as HTMLCanvasElement).hash).not.to.equal(first)
      })
    })
  })
})
