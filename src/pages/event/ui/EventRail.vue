<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { goToSection } from '@/shared/motion'

import { CHAPTERS, sectionId } from '../lib/chapters'

defineProps<{ active: number }>()

const { t } = useI18n()
</script>

<template>
  <nav class="event__rail" :aria-label="t('event.chaptersLabel')">
    <ol class="event__rail-list">
      <li v-for="(chapter, index) in CHAPTERS" :key="chapter">
        <a
          class="event__rail-link"
          :class="{ 'event__rail-link--active': active === index }"
          :href="`#${sectionId(chapter)}`"
          :aria-current="active === index ? 'location' : undefined"
          @click.prevent="goToSection(sectionId(chapter))"
        >
          <span class="event__rail-mark" aria-hidden="true" />
          {{ t(`event.chapters.${chapter}`) }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.event__rail {
  position: sticky;
  top: 50%;
  z-index: 3;
  width: fit-content;
  height: 0;
  margin-left: calc(var(--frame-inset) + 1rem);
}
.event__rail-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  transform: translateY(-50%);
}
.event__rail-link {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.25rem;
  color: var(--hud-dim);
  font: 500 0.75rem var(--font-mono);
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.25s ease;
}
.event__rail-link:hover,
.event__rail-link--active {
  color: #fff;
}
.event__rail-mark {
  width: 0.4375rem;
  height: 0.4375rem;
  border: 1px solid currentColor;
  transition: background-color 0.25s ease;
}
.event__rail-link--active .event__rail-mark {
  background: #fff;
}
/* 좁은 화면에서는 왼쪽 목차가 본문을 가리므로 순서대로 스크롤해 읽습니다 */
@media (max-width: 899px) {
  .event__rail {
    display: none;
  }
}
</style>
