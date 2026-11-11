import { canvasPrint } from '../../../../cypress/support/canvas'

import { defineComponent, h } from 'vue'

import { useMotionPreference } from '@/shared/motion'

import ConstellationSky from './ConstellationSky.vue'

/** 바닥을 덮는 검은 칠은 빼고, 별·선·이름처럼 밝게 그린 화소만 셉니다. */
function brightPixels(canvas: HTMLCanvasElement): number {
  const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
  let count = 0
  for (let index = 0; index < data.length; index += 4) {
    if ((data[index + 3] as number) > 0 && (data[index] as number) + (data[index + 1] as number) + (data[index + 2] as number) > 120) count += 1
  }
  return count
}

const RouterLink = defineComponent({ props: { to: { type: [String, Object], required: true } }, setup: (_, { slots }) => () => h('a', { href: '#' }, slots.default?.()) })
const mountSky = () => cy.mount(ConstellationSky, { global: { stubs: { RouterLink } } })

// jsdom은 2D 캔버스를 그리지 못하므로 실제 브라우저에서 하늘이 그려지고 조작에 따라 바뀌는지 봅니다.
describe('ConstellationSky (실제 브라우저)', () => {
  it('별과 별자리선을 그린다', () => {
    mountSky()
    cy.get('canvas[role="img"]').should(($canvas) => {
      expect(brightPixels($canvas[0] as HTMLCanvasElement)).to.be.greaterThan(1500)
    })
  })


  it('가로로 끌면 하늘이 돌아간다', () => {
    // 별이 반짝이면 끌지 않아도 화소가 바뀌므로, 모션을 멈춰 끌기의 효과만 비교합니다.
    const motion = useMotionPreference()
    if (!motion.userPaused.value) motion.toggle()
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
    cy.wrap(null).then(() => {
      if (motion.userPaused.value) motion.toggle()
    })
  })
})
