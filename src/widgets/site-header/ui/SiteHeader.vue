<script setup lang="ts">
import { symSharpClose, symSharpMenu } from '@quasar/extras/material-symbols-sharp'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { SitePreferences } from '@/features/site-preferences'
import { ROUTES } from '@/shared/config'
import { formatUtc } from '@/shared/lib'
import { EASE, gsap, useMotionPreference } from '@/shared/motion'
import { ScrambleText } from '@/shared/ui'

const { t } = useI18n()
const { enabled } = useMotionPreference()

const links = [
  { to: ROUTES.control, key: 'nav.control', code: '01' },
  { to: ROUTES.catalog, key: 'nav.catalog', code: '02' },
  { to: ROUTES.observatory, key: 'nav.observatory', code: '03' },
]

const utc = ref(formatUtc(new Date()))
const menuOpen = ref(false)
const root = ref<HTMLElement>()
let timer: ReturnType<typeof setInterval>

/** 스크롤 위치에 정확히 비례해 줄어드는 헤더. 스크롤이 멈추면 함께 멈춥니다. */
function onScroll(): void {
  const progress = Math.min(1, window.scrollY / 160)
  root.value?.style.setProperty('--shrink', String(progress))
}

onMounted(() => {
  timer = setInterval(() => (utc.value = formatUtc(new Date())), 1000)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('scroll', onScroll)
})

function onMenuShow(): void {
  if (!enabled.value) return
  gsap.from('.menu__link-inner', { yPercent: 110, duration: 0.8, stagger: 0.07, ease: EASE.out })
}
</script>

<template>
  <header ref="root" class="header">
    <p class="banner">
      <span class="banner__code">{{ t('banner.classification') }}</span>
      <span class="banner__notice">{{ t('banner.notice') }}</span>
      <time class="banner__clock" aria-hidden="true">UTC {{ utc }}</time>
    </p>
    <div class="bar">
      <RouterLink :to="ROUTES.home" class="logo" :aria-label="t('brand.name')">
        <span class="logo__dot" aria-hidden="true" />
        <span class="logo__text" aria-hidden="true">Beyond<br />the Quasar</span>
      </RouterLink>

      <nav class="nav" :aria-label="t('nav.main')">
        <ul class="nav__list">
          <li v-for="link in links" :key="link.to">
            <RouterLink :to="link.to" class="nav__link">
              <span class="nav__code" aria-hidden="true">{{ link.code }}</span>
              <ScrambleText :text="t(link.key)" />
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="bar__end">
        <SitePreferences />
        <button
          type="button"
          class="burger"
          :aria-label="t('nav.open')"
          aria-haspopup="dialog"
          :aria-expanded="menuOpen"
          @click="menuOpen = true"
        >
          <q-icon :name="symSharpMenu" size="1.5rem" />
        </button>
      </div>
    </div>

    <q-dialog v-model="menuOpen" :aria-label="t('nav.main')" maximized transition-show="fade" transition-hide="fade" @show="onMenuShow">
      <div class="menu">
        <button type="button" class="menu__close" :aria-label="t('nav.close')" @click="menuOpen = false">
          <q-icon :name="symSharpClose" size="1.75rem" />
        </button>
        <nav :aria-label="t('nav.main')">
          <ul class="menu__list">
            <li v-for="link in links" :key="link.to" class="menu__item">
              <RouterLink :to="link.to" class="menu__link" @click="menuOpen = false">
                <span class="menu__link-inner"><span class="nav__code" aria-hidden="true">{{ link.code }}</span> {{ t(link.key) }}</span>
              </RouterLink>
            </li>
          </ul>
        </nav>
      </div>
    </q-dialog>
  </header>
</template>

<style scoped>
.header {
  --shrink: 0;
  /* 줄어드는 높이가 문서 높이와 스크롤 위치를 바꾸지 않도록 흐름에서 뺍니다. */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--paper) calc(70% + 30% * var(--shrink)), transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: var(--banner-height);
  margin: 0;
  padding: 0 var(--margin);
  border-bottom: 1px solid var(--line);
  font: 500 0.6875rem/1.2 var(--font-mono);
}
.banner__code {
  color: var(--signal-text);
  white-space: nowrap;
}
.banner__notice {
  color: var(--muted);
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.banner__clock {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
@media (max-width: 720px) {
  .banner__notice,
  .banner__clock {
    display: none;
  }
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: calc(var(--header-height) - (var(--header-height) - 3.25rem) * var(--shrink));
  padding: 0 var(--margin);
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  text-decoration: none;
  transform-origin: left center;
  transform: scale(calc(1 - 0.12 * var(--shrink)));
}
.logo__dot {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--signal);
  box-shadow: 0 0 1.25rem color-mix(in srgb, var(--signal) 70%, transparent);
  transition: transform 0.5s var(--ease-out);
}
.logo:hover .logo__dot {
  transform: scale(1.35);
}
.logo__text {
  font: 800 0.875rem/1.02 var(--font-display);
  font-stretch: 112%;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}
.nav__list {
  display: flex;
  gap: clamp(1rem, 3vw, 2.75rem);
  margin: 0;
  padding: 0;
  list-style: none;
}
.nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
}
.nav__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.375rem;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.45s var(--ease-out);
}
.nav__link:hover::after,
.nav__link.router-link-active::after {
  transform: scaleX(1);
  transform-origin: left;
}
.nav__code {
  font: 400 0.6875rem var(--font-mono);
  color: var(--muted);
}
.bar__end {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.burger {
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  background: none;
  border: 0;
  color: var(--ink);
}
@media (max-width: 860px) {
  .nav {
    display: none;
  }
  .burger {
    display: inline-grid;
  }
}
.menu {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 100%;
  padding: var(--margin);
  background: var(--paper);
  color: var(--ink);
}
.menu__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  background: none;
  border: 1px solid var(--line-strong);
  color: var(--ink);
}
.menu__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu__item {
  overflow: hidden;
}
.menu__link {
  display: block;
  padding: 0.375rem 0;
  font: 800 clamp(2rem, 10vw, 3.5rem) / 1.1 var(--font-sans);
  text-decoration: none;
}
.menu__link-inner {
  display: inline-block;
}
</style>
