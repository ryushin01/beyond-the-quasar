<script setup lang="ts">
import { useIntersectionObserver, useResizeObserver } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { useMotionPreference } from '@/shared/motion'

import { FRAGMENT_SHADER, VERTEX_SHADER } from '../lib/shader'

const props = withDefaults(defineProps<{ progress?: number }>(), { progress: 0 })

const { enabled } = useMotionPreference()
const canvas = ref<HTMLCanvasElement>()
const unsupported = ref(false)

let gl: WebGLRenderingContext | null = null
let uniforms: Record<string, WebGLUniformLocation | null> = {}
let frame = 0
let visible = true
let startedAt = 0
const pointer = { x: 0.72, y: 0.5, tx: 0.72, ty: 0.5, power: 0 }

function compile(type: number, source: string): WebGLShader | null {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

function setup(): boolean {
  gl = canvas.value?.getContext('webgl', { antialias: false, powerPreference: 'low-power' }) ?? null
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
  for (const name of ['uResolution', 'uPointer', 'uPointerPower', 'uTime', 'uProgress']) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }
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
  if (!gl) return
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

function loop(now: number): void {
  drawFrame(now)
  frame = requestAnimationFrame(loop)
}

function play(): void {
  cancelAnimationFrame(frame)
  if (enabled.value && visible && !document.hidden) frame = requestAnimationFrame(loop)
  else drawFrame(performance.now())
}

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
useIntersectionObserver(canvas, ([entry]) => {
  visible = entry?.isIntersecting ?? true
  play()
})

onMounted(() => {
  startedAt = performance.now()
  if (!setup()) {
    unsupported.value = true
    return
  }
  resize()
  play()
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('visibilitychange', play)
})

watch(enabled, play)

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('visibilitychange', play)
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
