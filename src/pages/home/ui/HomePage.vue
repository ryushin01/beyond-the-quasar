<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSatelliteCatalog } from '@/entities/satellite'
import { useSmoothScroll } from '@/shared/motion'
import { HomeHero } from '@/widgets/home-hero'
import { HomeManifesto } from '@/widgets/home-manifesto'
import { HomeProgress } from '@/widgets/home-progress'
import { LiveBoard } from '@/widgets/live-board'
import { OrbitAxes } from '@/widgets/orbit-axes'
import { PlateDeck } from '@/widgets/plate-deck'
import { SystemsIndex } from '@/widgets/systems-index'

import ConstellationSky from './ConstellationSky.vue'

useSmoothScroll()
const { t } = useI18n()
const { satellites } = useSatelliteCatalog()

const stops = computed(() => [
  { id: 'stop-sky', label: t('home.stopSky') },
  { id: 'stop-light', label: t('home.stopLight') },
  { id: 'stop-assets', label: t('home.stopAssets') },
  { id: 'stop-axes', label: t('home.stopAxes') },
  { id: 'stop-systems', label: t('home.stopSystems') },
  { id: 'stop-board', label: t('home.stopBoard') },
])
</script>

<template>
  <div>
    <HomeProgress :stops="stops" />
    <HomeHero />
    <div id="stop-sky" class="home__stop" tabindex="-1"><ConstellationSky /></div>
    <!-- 화면을 붙잡는 구역도 전체 길이를 잴 수 있도록 바깥 요소를 기준으로 삼습니다 -->
    <div id="stop-light" class="home__stop" tabindex="-1"><HomeManifesto /></div>
    <div id="stop-assets" class="home__stop" tabindex="-1"><PlateDeck :satellites="satellites" /></div>
    <div id="stop-axes" class="home__stop" tabindex="-1"><OrbitAxes :satellites="satellites" /></div>
    <div id="stop-systems" class="home__stop" tabindex="-1"><SystemsIndex /></div>
    <div id="stop-board" class="home__stop" tabindex="-1"><LiveBoard :satellites="satellites" /></div>
  </div>
</template>

<style scoped>
.home__stop:focus {
  outline: none;
}
</style>
