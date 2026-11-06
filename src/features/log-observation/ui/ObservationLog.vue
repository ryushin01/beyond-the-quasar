<script setup lang="ts">
import { symSharpClose } from '@quasar/extras/material-symbols-sharp'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useObserver } from '@/entities/observer'
import { formatUtc } from '@/shared/lib'

import { useObservationLog } from '../model/log'

const props = defineProps<{ targetName: string }>()

const { t } = useI18n()
const observer = useObserver()
const log = useObservationLog()

const seeing = ref(3)
const note = ref('')
const status = ref('')

const seeingId = computed(() => `seeing-${props.targetName.replace(/\W/g, '')}`)

function save(): void {
  log.add({ targetName: props.targetName, siteId: observer.siteId, seeing: seeing.value, note: note.value.trim() })
  note.value = ''
  status.value = t('log.saved')
}
</script>

<template>
  <div class="log">
    <q-form class="log__form" greedy @submit.prevent="save">
      <p class="log__target"><span class="label-mono">{{ t('log.target') }}</span> <strong>{{ targetName }}</strong></p>
      <div>
        <label :for="seeingId" class="label-mono">{{ t('log.seeing') }}</label>
        <input :id="seeingId" v-model.number="seeing" type="range" min="1" max="5" step="1" class="log__range" :aria-valuetext="String(seeing)" />
      </div>
      <q-input
        v-model="note"
        type="textarea"
        rows="2"
        maxlength="200"
        :label="t('log.note')"
        lazy-rules="ondemand"
        :rules="[(value: string) => value.trim().length > 0 || t('log.noteRequired')]"
        outlined
        square
        dense
      />
      <q-btn type="submit" color="primary" unelevated square no-caps :label="t('log.save')" class="log__save" />
      <p class="sr-only" role="status">{{ status }}</p>
    </q-form>

    <p v-if="!log.entries.length" class="log__empty">{{ t('log.empty') }}</p>
    <ol v-else class="log__list">
      <li v-for="entry in log.entries" :key="entry.id" class="log__entry">
        <div>
          <strong>{{ entry.targetName }}</strong>
          <span class="log__meta">{{ formatUtc(new Date(entry.loggedAt), true) }} · {{ t(`sites.${entry.siteId}`) }} · {{ entry.seeing }}/5</span>
          <p class="log__note">{{ entry.note }}</p>
        </div>
        <q-btn flat dense square :icon="symSharpClose" :aria-label="t('log.remove', { name: entry.targetName })" class="log__remove" @click="log.remove(entry.id)" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.log {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1fr);
}
@media (min-width: 900px) {
  .log {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  }
}
.log__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.log__target {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
}
.log__range {
  display: block;
  width: 100%;
  min-height: 2rem;
  accent-color: var(--signal);
}
.log__save {
  min-height: 2.75rem;
}
.log__empty {
  margin: 0;
  color: var(--muted);
}
.log__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.log__entry {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--line);
}
.log__meta {
  display: block;
  font: 400 0.75rem var(--font-mono);
  color: var(--muted);
}
.log__note {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}
.log__remove {
  width: 2.5rem;
  height: 2.5rem;
  flex: none;
}
</style>
