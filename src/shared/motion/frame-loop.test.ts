import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import { useVisibleFrameLoop } from './frame-loop'

// requestAnimationFrame과 IntersectionObserver를 손으로 돌리는 가짜
let frames = new Map<number, FrameRequestCallback>()
let nextId = 1
let observerCallback: IntersectionObserverCallback | undefined

function runFrame(time = 16): void {
  const pending = [...frames.values()]
  frames = new Map()
  for (const callback of pending) callback(time)
}
function setVisible(visible: boolean): void {
  observerCallback?.([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)
}
function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  frames = new Map()
  nextId = 1
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextId++
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  setHidden(false)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

async function setup(options: { active?: () => boolean; initiallyVisible?: boolean } = {}) {
  const onFrame = vi.fn()
  const onStill = vi.fn()
  const onPlay = vi.fn()
  const onVisible = vi.fn()
  const scope = effectScope()
  const target = ref(document.createElement('div'))
  const loop = scope.run(() => useVisibleFrameLoop(target, { onFrame, onStill, onPlay, onVisible, ...options }))!
  await nextTick()
  return { onFrame, onStill, onPlay, onVisible, scope, loop }
}

describe('useVisibleFrameLoop', () => {
  it('보이고 탭이 열려 있고 활성이면 매 프레임 그린다', async () => {
    const { onFrame, onPlay, loop } = await setup({ active: () => true })
    setVisible(true)
    expect(loop.isRunning()).toBe(true)
    expect(onPlay).toHaveBeenCalled()
    runFrame()
    runFrame()
    expect(onFrame).toHaveBeenCalledTimes(2)
  })

  it('화면 밖으로 나가면 멈추고 정지 화면 한 장을 그린다', async () => {
    const { onFrame, onStill, onVisible, loop } = await setup({ active: () => true })
    setVisible(true)
    setVisible(false)
    expect(onVisible).toHaveBeenLastCalledWith(false)
    expect(loop.isRunning()).toBe(false)
    expect(onStill).toHaveBeenCalledTimes(1)
    runFrame()
    expect(onFrame).not.toHaveBeenCalled()
  })

  it('탭이 숨으면 멈추고 다시 보이면 이어 간다', async () => {
    const { loop } = await setup({ active: () => true })
    setVisible(true)
    setHidden(true)
    expect(loop.isRunning()).toBe(false)
    setHidden(false)
    expect(loop.isRunning()).toBe(true)
  })

  it('활성 조건(모션 설정 등)이 바뀌면 다시 정한다', async () => {
    const on = ref(false)
    const { onStill, loop } = await setup({ active: () => on.value })
    setVisible(true)
    expect(loop.isRunning()).toBe(false)
    expect(onStill).toHaveBeenCalled()
    on.value = true
    await nextTick()
    expect(loop.isRunning()).toBe(true)
  })

  it('처음 관찰 결과 전에는 initiallyVisible을 따른다', async () => {
    const { loop } = await setup({ active: () => true, initiallyVisible: false })
    loop.play()
    expect(loop.isRunning()).toBe(false)
  })

  it('범위가 끝나면 루프를 멈춘다', async () => {
    const { onFrame, scope, loop } = await setup({ active: () => true })
    setVisible(true)
    scope.stop()
    expect(loop.isRunning()).toBe(false)
    runFrame()
    expect(onFrame).not.toHaveBeenCalled()
  })
})
