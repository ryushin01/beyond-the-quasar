<script setup lang="ts">
import EventStage from './EventStage.vue'
</script>

<template>
  <Story title="pages/event/EventStage">
    <Variant title="입구"><div style="position: relative; height: 480px"><EventStage /></div></Variant>
    <Variant title="블랙홀"><div style="position: relative; height: 480px"><EventStage :mix="1" /></div></Variant>
    <Variant title="낙하"><div style="position: relative; height: 480px"><EventStage :mix="1" :fall="0.5" /></div></Variant>
  </Story>
</template>
