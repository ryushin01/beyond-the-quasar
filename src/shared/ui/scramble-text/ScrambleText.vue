<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { scramble, useMotionPreference } from '@/shared/motion'

const props = defineProps<{ text: string }>()

const { enabled } = useMotionPreference()
const root = ref<HTMLElement>()
const visual = ref<HTMLElement>()
let cancel: (() => void) | undefined
let host: HTMLElement | null = null

function play(): void {
  if (!enabled.value || !visual.value) return
  cancel?.()
  cancel = scramble(visual.value, props.text)
}

onMounted(() => {
  host = root.value?.closest<HTMLElement>('a, button') ?? root.value ?? null
  host?.addEventListener('pointerenter', play)
})

onBeforeUnmount(() => {
  host?.removeEventListener('pointerenter', play)
  cancel?.()
})

watch(
  () => props.text,
  (text) => {
    cancel?.()
    if (visual.value) visual.value.textContent = text
  },
)
</script>

<template>
  <span ref="root" class="inline-block">
    <span class="sr-only">{{ text }}</span>
    <span ref="visual" aria-hidden="true">{{ text }}</span>
  </span>
</template>
