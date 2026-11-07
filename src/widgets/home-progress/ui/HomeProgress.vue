<script lang="ts">
export interface HomeStop {
  /** 구역 요소의 id */
  id: string
  label: string
}
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { scrollToElement } from '@/shared/motion'

import { readProgress } from '../lib/progress'

const props = defineProps<{ stops: HomeStop[] }>()

const { t } = useI18n()
const state = ref(readProgress(0, []))
const shown = computed(() => state.value.active >= 0)
let frame = 0

function measure(): void {
  frame = 0
  const boxes = props.stops.map(({ id }) => {
    const box = document.getElementById(id)?.getBoundingClientRect()
    return { top: box?.top ?? 0, height: box?.height ?? 0 }
  })
  state.value = readProgress(window.innerHeight / 2, boxes)
}

function schedule(): void {
  if (!frame) frame = requestAnimationFrame(measure)
}

function go(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  scrollToElement(target)
  target.focus({ preventScroll: true })
}

useEventListener(window, 'scroll', schedule, { passive: true })
useEventListener(window, 'resize', schedule, { passive: true })
onMounted(schedule)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <nav class="progress scope-dark" :class="{ 'progress--shown': shown }" :aria-label="t('home.progressLabel')">
    <ol class="progress__list">
      <li v-for="(stop, index) in stops" :key="stop.id" class="progress__item" :class="{ 'progress__item--active': state.active === index }">
        <a class="progress__link" :href="`#${stop.id}`" :aria-current="state.active === index ? 'location' : undefined" @click.prevent="go(stop.id)">
          <span class="progress__num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="progress__label">{{ stop.label }}</span>
          <!-- 채워진 부분만 글자색이 뒤집히도록 같은 내용을 잘라서 겹칩니다 -->
          <span class="progress__fill" aria-hidden="true" :style="{ '--fill': state.fills[index] ?? 0 }">
            <span class="progress__num">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="progress__label">{{ stop.label }}</span>
          </span>
        </a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.progress {
  position: fixed;
  z-index: 40;
  bottom: max(0.875rem, env(safe-area-inset-bottom));
  left: 50%;
  width: min(100vw - 2 * var(--margin), 50rem);
  padding: 2px;
  background: #000;
  border: 1px solid var(--line-strong);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 1rem);
  transition:
    opacity 0.3s ease,
    transform 0.5s var(--ease-out);
}
/* 첫 화면과 푸터에서는 숨기지만, 키보드로 들어오면 바로 보입니다 */
.progress--shown,
.progress:focus-within {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
}
.progress__list {
  display: flex;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.progress__item {
  flex: 1 1 0;
  min-width: 0;
  transition: flex-grow 0.5s var(--ease-out);
}
.progress__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  padding: 0 0.625rem;
  overflow: hidden;
  background: #1a1a1e;
  color: #fff;
  font: 500 0.75rem var(--font-mono);
  text-decoration: none;
  white-space: nowrap;
}
.progress__link:hover {
  background: #2a2a30;
}
.progress__fill {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.625rem;
  background: var(--signal);
  color: #000;
  clip-path: inset(0 calc((1 - var(--fill)) * 100%) 0 0);
}
.progress__num {
  flex: none;
}
/* 좁은 화면에서는 현재 구역만 이름을 펼칩니다. 다른 구역의 이름은 링크 이름으로 남습니다 */
@media (max-width: 719px) {
  .progress__link {
    min-height: 2.25rem;
    justify-content: center;
    padding: 0 0.25rem;
  }
  .progress__fill {
    justify-content: center;
    padding: 0 0.25rem;
  }
  .progress__item--active {
    flex-grow: 3;
  }
  .progress__item:not(.progress__item--active) .progress__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
}
</style>
