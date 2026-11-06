<script setup lang="ts">
import QuasarField from './QuasarField.vue'
</script>

<template>
  <Story title="widgets/QuasarField">
    <Variant title="기본"><div style="position: relative; height: 480px"><QuasarField /></div></Variant>
    <Variant title="진행 0.6"><div style="position: relative; height: 480px"><QuasarField :progress="0.6" /></div></Variant>
  </Story>
</template>
