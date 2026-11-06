<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { consumeRestoreTop } from './providers/router'
import { syncDocumentLanguage } from '@/shared/i18n'
import { ScrollTrigger } from '@/shared/motion'
import { Preloader } from '@/widgets/preloader'
import { RouteShutter } from '@/widgets/route-shutter'
import { SiteFooter } from '@/widgets/site-footer'
import { SiteHeader } from '@/widgets/site-header'
import { TargetCursor } from '@/widgets/target-cursor'

const { t } = useI18n()
const route = useRoute()
syncDocumentLanguage()

useTitle(computed(() => t(String(route.meta.title ?? 'brand.name'))))

const shutter = ref<InstanceType<typeof RouteShutter>>()
const main = ref<HTMLElement>()
const firstRender = ref(true)

async function onLeave(_element: Element, done: () => void): Promise<void> {
  await shutter.value?.cover()
  done()
}

async function onEnter(_element: Element, done: () => void): Promise<void> {
  // 고정 구역의 높이가 정해진 뒤에 이전 위치로 돌아갑니다.
  await nextTick()
  ScrollTrigger.refresh()
  window.scrollTo(0, consumeRestoreTop())
  done()
  if (firstRender.value) {
    firstRender.value = false
    return
  }
  // 화면이 바뀌면 키보드·스크린리더 사용자의 위치를 본문 처음으로 옮깁니다.
  main.value?.focus({ preventScroll: true })
  await shutter.value?.reveal()
}

function skipToContent(): void {
  main.value?.focus()
}
</script>

<template>
  <a href="#main" class="skip-link" @click.prevent="skipToContent">{{ t('a11y.skip') }}</a>
  <SiteHeader />
  <main id="main" ref="main" tabindex="-1" class="main">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition :css="false" mode="out-in" @leave="onLeave" @enter="onEnter">
        <component :is="Component" :key="viewRoute.path" />
      </Transition>
    </RouterView>
  </main>
  <SiteFooter v-if="!route.meta.console" />
  <RouteShutter ref="shutter" />
  <Preloader />
  <TargetCursor />
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 200;
  padding: 0.75rem 1rem;
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
  transform: translateY(-200%);
}
.skip-link:focus {
  transform: translateY(0);
}
.main {
  padding-top: var(--chrome-height);
  outline: none;
}
</style>
