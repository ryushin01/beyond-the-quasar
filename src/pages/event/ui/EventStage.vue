<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { createFullscreenShader } from '@/shared/lib'
import { useMotionPreference, useVisibleFrameLoop } from '@/shared/motion'

import { FRAGMENT_SHADER, VERTEX_SHADER } from '../lib/shader'

const props = withDefaults(defineProps<{ mix?: number; fall?: number; dim?: number; allowSoftware?: boolean }>(), { mix: 0, fall: 0, dim: 0, allowSoftware: false })

const UNIFORMS = ['uResolution', 'uTime', 'uMix', 'uFall', 'uDim'] as const
/** 모션을 멈췄을 때 고정해 두는 장면 시각 */
const STILL_TIME = 21
const TIME_WRAP_SECONDS = 3600
const SLOW_FRAME_MS = 34
const SAMPLE_FRAMES = 40
const MIN_QUALITY = 0.45

const { enabled } = useMotionPreference()
const canvas = ref<HTMLCanvasElement>()
const unsupported = ref(false)
/** 셰이더가 준비되어 그릴 수 있는 상태. WebGL 맥락을 잃으면 false가 됩니다. */
const ready = ref(false)

let gl: WebGLRenderingContext | null = null
let uniforms: Partial<Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>> = {}
let pendingDraw = 0
let startedAt = 0
let quality = 1
let lastFrameAt = 0
let frameSum = 0
let frameCount = 0
let disposed = false

function setup(): boolean {
  // GPU 가속이 없으면 광선 적분이 CPU에서 돌아 화면이 멈추므로 정적 대체 화면을 씁니다.
  gl = canvas.value?.getContext('webgl', { antialias: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !props.allowSoftware }) ?? null
  if (!gl) return false
  const found = createFullscreenShader(gl, VERTEX_SHADER, FRAGMENT_SHADER, UNIFORMS)
  if (!found) return false
  uniforms = found
  return true
}

function resize(): void {
  if (!canvas.value || !gl) return
  const scale = Math.min(window.devicePixelRatio || 1, 1) * quality
  const width = Math.max(1, Math.round(canvas.value.clientWidth * scale))
  const height = Math.max(1, Math.round(canvas.value.clientHeight * scale))
  if (canvas.value.width === width && canvas.value.height === height) return
  canvas.value.width = width
  canvas.value.height = height
  gl.viewport(0, 0, width, height)
  draw(performance.now())
}

function draw(now: number): void {
  if (!gl || !ready.value) return
  gl.uniform2f(uniforms.uResolution!, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.uniform1f(uniforms.uTime!, enabled.value ? ((now - startedAt) / 1000) % TIME_WRAP_SECONDS : STILL_TIME)
  gl.uniform1f(uniforms.uMix!, props.mix)
  gl.uniform1f(uniforms.uFall!, props.fall)
  gl.uniform1f(uniforms.uDim!, props.dim)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

/** 프레임이 밀리는 기기에서는 내부 해상도만 낮춰 움직임을 유지합니다. */
function adaptQuality(now: number): void {
  if (lastFrameAt) {
    frameSum += now - lastFrameAt
    frameCount += 1
  }
  lastFrameAt = now
  if (frameCount < SAMPLE_FRAMES) return
  const average = frameSum / frameCount
  frameSum = 0
  frameCount = 0
  if (average > SLOW_FRAME_MS && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality * 0.8)
    resize()
  }
}

// 화면에 보이고 탭이 열려 있고 모션이 허용될 때만 매 프레임 그리고, 아니면 정지 화면 한 장을 그립니다.
const loop = useVisibleFrameLoop(canvas, {
  onFrame: (now) => {
    draw(now)
    adaptQuality(now)
  },
  onStill: draw,
  // 멈춰 있던 시간을 프레임 간격으로 세지 않도록 다시 시작할 때 비웁니다.
  onPlay: () => (lastFrameAt = 0),
  active: () => enabled.value && ready.value,
})

/** 멈춘 상태에서도 장면 값이 바뀌면 한 장만 다시 그립니다. */
function drawOnce(): void {
  if (loop.isRunning() || pendingDraw) return
  pendingDraw = requestAnimationFrame((now) => {
    pendingDraw = 0
    draw(now)
  })
}

useResizeObserver(canvas, resize)
watch(() => [props.mix, props.fall, props.dim], drawOnce)

// 휴대폰에서 탭을 오래 숨기거나 GPU가 초기화되면 WebGL 맥락을 잃습니다. 기본 동작을 막아야 브라우저가 맥락을 되돌려 주고,
// 되돌아오면 셰이더를 다시 준비해 이어 그립니다(그러지 않으면 검은 화면으로 남음).
useEventListener(canvas, 'webglcontextlost', (event: Event) => {
  if (disposed) return
  event.preventDefault()
  ready.value = false
})
useEventListener(canvas, 'webglcontextrestored', () => {
  if (disposed) return
  if (!setup()) {
    unsupported.value = true
    return
  }
  ready.value = true
  // 모션이 꺼져 있으면 활성 조건이 그대로라 루프가 다시 정해지지 않으므로, 직접 불러 정지 화면이라도 한 장 그립니다.
  loop.play()
})

let idle = 0

function start(): void {
  if (disposed) return
  startedAt = performance.now()
  if (!setup()) {
    unsupported.value = true
    return
  }
  ready.value = true
  resize()
}

// 셰이더 컴파일이 첫 화면 글자를 늦추지 않도록, 글자가 그려진 뒤 한가할 때 켭니다.
onMounted(() => {
  idle = typeof requestIdleCallback === 'function' ? requestIdleCallback(start, { timeout: 600 }) : window.setTimeout(start, 60)
})

onBeforeUnmount(() => {
  disposed = true
  ready.value = false
  if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle)
  clearTimeout(idle)
  cancelAnimationFrame(pendingDraw)
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
  uniforms = {}
})
</script>

<template>
  <div class="stage" aria-hidden="true">
    <canvas v-show="!unsupported" ref="canvas" class="stage__canvas" />
    <div v-if="unsupported" class="stage__fallback" />
  </div>
</template>

<style scoped>
.stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #00030c;
}
.stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.stage__fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 50% 42%, transparent 0 14%, rgb(26 63 224 / 0.9) 15%, transparent 19%),
    radial-gradient(ellipse 80% 30% at 50% 70%, rgb(20 48 170 / 0.5), transparent 70%),
    #00030c;
}
</style>
