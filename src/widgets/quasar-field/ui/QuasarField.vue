<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { createFullscreenShader } from '@/shared/lib'
import { useMotionPreference, useVisibleFrameLoop } from '@/shared/motion'

import { FRAGMENT_SHADER, VERTEX_SHADER } from '../lib/shader'

const props = withDefaults(defineProps<{ progress?: number }>(), { progress: 0 })

const { enabled } = useMotionPreference()
const canvas = ref<HTMLCanvasElement>()
const unsupported = ref(false)
/** 셰이더가 준비되어 그릴 수 있는 상태. WebGL 맥락을 잃으면 false가 됩니다. */
const ready = ref(false)

let gl: WebGLRenderingContext | null = null
let uniforms: Record<string, WebGLUniformLocation | null> = {}
let startedAt = 0
let disposed = false
const pointer = { x: 0.72, y: 0.5, tx: 0.72, ty: 0.5, power: 0 }

function setup(): boolean {
  gl = canvas.value?.getContext('webgl', { antialias: false, powerPreference: 'low-power' }) ?? null
  if (!gl) return false
  const found = createFullscreenShader(gl, VERTEX_SHADER, FRAGMENT_SHADER, ['uResolution', 'uPointer', 'uPointerPower', 'uTime', 'uProgress'])
  if (!found) return false
  uniforms = found
  return true
}

function resize(): void {
  if (!canvas.value || !gl) return
  const scale = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.max(1, Math.round(canvas.value.clientWidth * scale))
  const height = Math.max(1, Math.round(canvas.value.clientHeight * scale))
  if (canvas.value.width !== width || canvas.value.height !== height) {
    canvas.value.width = width
    canvas.value.height = height
    gl.viewport(0, 0, width, height)
    drawFrame(performance.now())
  }
}

function drawFrame(now: number): void {
  if (!gl || !ready.value) return
  pointer.x += (pointer.tx - pointer.x) * 0.09
  pointer.y += (pointer.ty - pointer.y) * 0.09
  pointer.power *= 0.965
  gl.uniform2f(uniforms.uResolution!, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.uniform2f(uniforms.uPointer!, pointer.x, pointer.y)
  gl.uniform1f(uniforms.uPointerPower!, pointer.power)
  gl.uniform1f(uniforms.uTime!, enabled.value ? (now - startedAt) / 1000 : 12)
  gl.uniform1f(uniforms.uProgress!, props.progress)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

// 화면에 보이고 탭이 열려 있고 모션이 허용될 때만 매 프레임 그리고, 아니면 정지 화면 한 장을 그립니다.
useVisibleFrameLoop(canvas, { onFrame: drawFrame, active: () => enabled.value && ready.value })

function onPointerMove(event: PointerEvent): void {
  if (!canvas.value) return
  const box = canvas.value.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width
  const y = 1 - (event.clientY - box.top) / box.height
  pointer.power = Math.min(1, pointer.power + Math.hypot(x - pointer.tx, y - pointer.ty) * 2.4)
  pointer.tx = x
  pointer.ty = y
}

useResizeObserver(canvas, resize)
useEventListener(window, 'pointermove', onPointerMove, { passive: true })

// 휴대폰에서 탭을 오래 숨기거나 GPU가 초기화되면 WebGL 맥락을 잃습니다. 기본 동작을 막아야 브라우저가 맥락을 되돌려 주고,
// 되돌아오면 셰이더를 다시 준비해 이어 그립니다(그러지 않으면 검은 화면으로 남음).
useEventListener(canvas, 'webglcontextlost', (event: Event) => {
  if (disposed) return
  event.preventDefault()
  ready.value = false
})
useEventListener(canvas, 'webglcontextrestored', () => {
  if (disposed) return
  if (setup()) ready.value = true
  else unsupported.value = true
})

onMounted(() => {
  startedAt = performance.now()
  if (!setup()) {
    unsupported.value = true
    return
  }
  ready.value = true
  resize()
})

onBeforeUnmount(() => {
  disposed = true
  ready.value = false
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
  uniforms = {}
})
</script>

<template>
  <div class="field" aria-hidden="true">
    <canvas v-show="!unsupported" ref="canvas" class="field__canvas" />
    <div v-if="unsupported" class="field__fallback" />
  </div>
</template>

<style scoped>
.field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #000;
}
.field__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.field__fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(ellipse 45% 12% at 68% 50%, #4a78ff, transparent 70%),
    radial-gradient(circle at 68% 50%, #fff 0, transparent 6%);
}
</style>
