<script setup lang="ts">
import { useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useMotionPreference } from '@/shared/motion'

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

let gl: WebGLRenderingContext | null = null
let uniforms: Partial<Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>> = {}
let frame = 0
let visible = true
let pendingDraw = 0
let startedAt = 0
let quality = 1
let lastFrameAt = 0
let frameSum = 0
let frameCount = 0

function compile(type: number, source: string): WebGLShader | null {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

function setup(): boolean {
  // GPU 가속이 없으면 광선 적분이 CPU에서 돌아 화면이 멈추므로 정적 대체 화면을 씁니다.
  gl = canvas.value?.getContext('webgl', { antialias: false, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !props.allowSoftware }) ?? null
  if (!gl) return false
  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return false
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name)
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
  if (!gl) return
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

function loop(now: number): void {
  draw(now)
  adaptQuality(now)
  frame = requestAnimationFrame(loop)
}

function play(): void {
  cancelAnimationFrame(frame)
  frame = 0
  lastFrameAt = 0
  if (enabled.value && visible && !document.hidden) frame = requestAnimationFrame(loop)
  else draw(performance.now())
}

/** 멈춘 상태에서도 장면 값이 바뀌면 한 장만 다시 그립니다. */
function drawOnce(): void {
  if (frame || pendingDraw) return
  pendingDraw = requestAnimationFrame((now) => {
    pendingDraw = 0
    draw(now)
  })
}

useResizeObserver(canvas, resize)
useIntersectionObserver(canvas, ([entry]) => {
  visible = entry?.isIntersecting ?? true
  play()
})

watch(() => [props.mix, props.fall, props.dim], drawOnce)
watch(enabled, play)

let disposed = false
let idle = 0

function start(): void {
  if (disposed) return
  startedAt = performance.now()
  if (!setup()) {
    unsupported.value = true
    return
  }
  resize()
  play()
  document.addEventListener('visibilitychange', play)
}

// 셰이더 컴파일이 첫 화면 글자를 늦추지 않도록, 글자가 그려진 뒤 한가할 때 켭니다.
onMounted(() => {
  idle = typeof requestIdleCallback === 'function' ? requestIdleCallback(start, { timeout: 600 }) : window.setTimeout(start, 60)
})

onBeforeUnmount(() => {
  disposed = true
  if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idle)
  clearTimeout(idle)
  cancelAnimationFrame(frame)
  cancelAnimationFrame(pendingDraw)
  document.removeEventListener('visibilitychange', play)
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
    radial-gradient(circle at 50% 42%, transparent 0 14%, rgb(74 120 255 / 0.9) 15%, transparent 19%),
    radial-gradient(ellipse 80% 30% at 50% 70%, rgb(20 60 180 / 0.5), transparent 70%),
    #00030c;
}
</style>
