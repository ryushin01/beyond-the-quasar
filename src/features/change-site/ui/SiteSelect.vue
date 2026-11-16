<script setup lang="ts">
import { symSharpArrowDropDown } from '@quasar/extras/material-symbols-sharp'
import { useQuasar } from 'quasar'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { HERE_ID, SITES, useObserver } from '@/entities/observer'

defineProps<{ label: string }>()

const { t } = useI18n()
const $q = useQuasar()
const observer = useObserver()
const locating = ref(false)
/** 위치 요청 번호. 기다리는 사이 다른 관측지를 고르면 번호가 바뀌어, 늦게 온 위치가 그 선택을 덮어쓰지 않습니다. */
let request = 0

const options = computed(() => [
  ...SITES.map((site) => ({ value: site.id, label: t(`sites.${site.id}`) })),
  { value: HERE_ID, label: t('sites.here') },
])

/** '현재 위치'를 고르면 그때 브라우저 위치를 묻습니다. 거부하거나 받지 못하면 이전 관측지를 그대로 둡니다. */
function locate(): void {
  if (!('geolocation' in navigator)) {
    $q.notify({ message: t('sites.hereUnsupported'), position: 'bottom', timeout: 3500 })
    return
  }
  const id = ++request
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (id !== request) return
      locating.value = false
      observer.setHere({ latitude: position.coords.latitude, longitude: position.coords.longitude })
    },
    () => {
      if (id !== request) return
      locating.value = false
      $q.notify({ message: t('sites.hereError'), position: 'bottom', timeout: 3500 })
    },
    // 관측에는 1 km 정도면 충분하므로 정밀 측위를 쓰지 않고, 10분 안의 위치는 다시 씁니다.
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
  )
}

const model = computed({
  get: () => observer.siteId,
  set: (value: string) => {
    if (value === HERE_ID) return locate()
    // 기다리던 위치 요청이 있으면 버립니다.
    request += 1
    locating.value = false
    observer.siteId = value
  },
})
</script>

<template>
  <q-select
    v-model="model"
    :options="options"
    :label="label"
    :dropdown-icon="symSharpArrowDropDown"
    :loading="locating"
    emit-value
    map-options
    dense
    outlined
    square
    options-dense
  />
</template>
