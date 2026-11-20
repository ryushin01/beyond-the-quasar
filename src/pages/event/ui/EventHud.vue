<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { CHAPTERS } from '../lib/chapters'

const props = defineProps<{ active: number }>()

const { t } = useI18n()
const pad = (value: number): string => String(value).padStart(2, '0')
const activeNumber = computed(() => pad(props.active + 1))
</script>

<template>
  <div class="event__sticky event__sticky--hud">
    <div class="event__frame" aria-hidden="true" />
    <div class="event__bar" aria-hidden="true">
      <span>{{ t('event.simulation') }}</span>
      <span class="event__bar-center">{{ t('event.scroll') }}</span>
      <span>{{ activeNumber }} / {{ pad(CHAPTERS.length) }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 모서리를 깎은 관제 화면 테두리 */
.event__frame {
  position: absolute;
  inset: calc(var(--chrome-height) + 0.5rem) var(--frame-inset) var(--frame-inset);
  background: var(--hud-line);
  clip-path: polygon(
    evenodd,
    var(--cut) 0,
    calc(100% - var(--cut)) 0,
    100% var(--cut),
    100% calc(100% - var(--cut)),
    calc(100% - var(--cut)) 100%,
    var(--cut) 100%,
    0 calc(100% - var(--cut)),
    0 var(--cut),
    var(--cut) 0,
    var(--cut) 1px,
    calc(var(--cut) + 0.4px) 1px,
    1px calc(var(--cut) + 0.4px),
    1px calc(100% - var(--cut) - 0.4px),
    calc(var(--cut) + 0.4px) calc(100% - 1px),
    calc(100% - var(--cut) - 0.4px) calc(100% - 1px),
    calc(100% - 1px) calc(100% - var(--cut) - 0.4px),
    calc(100% - 1px) calc(var(--cut) + 0.4px),
    calc(100% - var(--cut) - 0.4px) 1px,
    var(--cut) 1px
  );
}
.event__bar {
  position: absolute;
  left: var(--frame-inset);
  right: var(--frame-inset);
  bottom: var(--frame-inset);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 3rem;
  padding: 0 calc(var(--cut) + 0.75rem);
  border-top: 1px solid var(--hud-line);
  /* 스크롤되는 본문이 지나가도 글자가 겹쳐 읽히지 않게 합니다 */
  background: rgb(0 3 12 / 0.86);
  color: var(--hud-text);
  font: 500 0.75rem var(--font-mono);
  text-transform: uppercase;
}
@media (max-width: 899px) {
  .event__bar-center {
    display: none;
  }
}
</style>
