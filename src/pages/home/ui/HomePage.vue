<script setup lang="ts">
import { useSatelliteCatalog } from '@/entities/satellite'
import { useSmoothScroll } from '@/shared/motion'
import { HomeHero } from '@/widgets/home-hero'
import { HomeManifesto } from '@/widgets/home-manifesto'
import { LiveBoard } from '@/widgets/live-board'
import { PlateDeck } from '@/widgets/plate-deck'
import { SystemsIndex } from '@/widgets/systems-index'

useSmoothScroll()
const { satellites } = useSatelliteCatalog()
</script>

<template>
  <div>
    <HomeHero />
    <HomeManifesto />
    <PlateDeck :satellites="satellites" />
    <SystemsIndex />
    <LiveBoard :satellites="satellites" />
  </div>
</template>
