<script setup lang="ts">
import UplinkForm from './UplinkForm.vue'
</script>

<template>
  <Story title="features/UplinkForm">
    <Variant title="교신 가능"><UplinkForm :norad-id="25544" satellite-name="ISS (ZARYA)" :range-km="812" /></Variant>
    <Variant title="교신 불가"><UplinkForm :norad-id="36868" satellite-name="AEHF-1" :range-km="null" /></Variant>
  </Story>
</template>
