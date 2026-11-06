<script setup lang="ts">
import { symSharpArrowDropDown } from '@quasar/extras/material-symbols-sharp'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { SITES, useObserver } from '@/entities/observer'

defineProps<{ label: string }>()

const { t } = useI18n()
const observer = useObserver()
const options = computed(() =>
  SITES.map((site) => ({
    value: site.id,
    label: t(`sites.${site.id}`),
  })),
)
</script>

<template>
  <q-select
    v-model="observer.siteId"
    :options="options"
    :label="label"
    :dropdown-icon="symSharpArrowDropDown"
    emit-value
    map-options
    dense
    outlined
    square
    options-dense
  />
</template>
