<script setup lang="ts">
import { symSharpArrowDropDown } from '@quasar/extras/material-symbols-sharp'
import { useQuasar } from 'quasar'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatUtc } from '@/shared/lib'

import { COMMANDS, useCommandLog, useSendCommand, type CommandType } from '../model/commands'

const props = defineProps<{
  noradId: number
  satelliteName: string
  /** 교신 가능하면 거리(km), 아니면 null */
  rangeKm: number | null
}>()

const { t } = useI18n()
const $q = useQuasar()
const log = useCommandLog()
const { mutate, isPending } = useSendCommand()

const command = ref<CommandType>('ping')
const note = ref('')
const confirming = ref(false)

const options = computed(() => COMMANDS.map((value) => ({ value, label: t(`commands.${value}`) })))

function send(): void {
  if (isPending.value) return
  const name = props.satelliteName
  const type = command.value
  mutate(
    { noradId: props.noradId, satelliteName: name, command: type, note: note.value.trim(), rangeKm: props.rangeKm },
    {
      onSuccess: (result) => {
        note.value = ''
        $q.notify({
          message: result.state === 'ack' ? t('uplink.sent', { name, command: t(`commands.${type}`), ms: result.latencyMs ?? 0 }) : t('uplink.queued', { name }),
          color: result.state === 'ack' ? 'primary' : 'warning',
          textColor: result.state === 'ack' ? 'white' : 'black',
          position: 'bottom-right',
          timeout: 4000,
        })
      },
    },
  )
}

function onSubmit(): void {
  if (command.value === 'safe-mode') confirming.value = true
  else send()
}
</script>

<template>
  <div class="uplink">
    <p class="uplink__notice">{{ t('uplink.notice') }}</p>
    <q-form class="uplink__form" @submit.prevent="onSubmit">
      <p class="uplink__target"><span class="label-mono">{{ t('uplink.target') }}</span> <strong>{{ satelliteName }}</strong></p>
      <q-select v-model="command" :options="options" :label="t('uplink.command')" :dropdown-icon="symSharpArrowDropDown" emit-value map-options dense outlined square />
      <q-input v-model="note" :label="t('uplink.note')" :hint="t('uplink.noteHint')" maxlength="80" dense outlined square />
      <q-btn type="submit" color="primary" unelevated square no-caps class="uplink__send" :loading="isPending" :disable="isPending" :label="t('uplink.send')" />
    </q-form>

    <div class="uplink__log">
      <header class="uplink__log-head">
        <h3 class="uplink__h">{{ t('uplink.log') }}</h3>
        <button v-if="log.entries.length" type="button" class="uplink__clear" @click="log.clear()">{{ t('uplink.clear') }}</button>
      </header>
      <p v-if="!log.entries.length" class="uplink__empty">{{ t('uplink.logEmpty') }}</p>
      <ol v-else class="uplink__list">
        <li v-for="entry in log.entries" :key="entry.id" class="uplink__entry">
          <span class="uplink__time">{{ formatUtc(new Date(entry.sentAt)) }}</span>
          <span class="uplink__body">{{ entry.satelliteName }} · {{ t(`commands.${entry.command}`) }}<template v-if="entry.note"> · {{ entry.note }}</template></span>
          <span class="uplink__state" :class="{ 'uplink__state--queued': entry.state === 'queued' }">
            {{ entry.state === 'ack' ? `${t('uplink.stateAck')} ${entry.latencyMs}ms` : t('uplink.stateQueued') }}
          </span>
        </li>
      </ol>
    </div>

    <q-dialog v-model="confirming" :aria-label="t('uplink.confirmTitle')">
      <q-card class="uplink__dialog" square>
        <q-card-section>
          <h3 class="uplink__h uplink__h--big">{{ t('uplink.confirmTitle') }}</h3>
          <p class="uplink__confirm">{{ t('uplink.confirmBody', { name: satelliteName }) }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps :label="t('uplink.cancel')" />
          <q-btn v-close-popup unelevated no-caps color="primary" :label="t('uplink.confirm')" @click="send" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.uplink {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
}
.uplink__notice {
  margin: 0;
  padding: 0.5rem 0.625rem;
  border-left: 3px solid var(--alert);
  font-size: 0.8125rem;
  line-height: 1.4;
}
.uplink__form {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.uplink__target {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
  font-size: 0.875rem;
}
.uplink__send {
  min-height: 2.75rem;
}
.uplink__log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}
.uplink__h {
  margin: 0;
  font: 600 0.8125rem var(--font-sans);
  letter-spacing: 0;
}
.uplink__h--big {
  font-size: 1.125rem;
  line-height: 1.4;
}
.uplink__confirm {
  margin: 0.5rem 0 0;
}
.uplink__clear {
  min-height: 2rem;
  background: none;
  border: 0;
  color: var(--ink);
  font-size: 0.75rem;
  text-decoration: underline;
  cursor: pointer;
}
.uplink__empty {
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
}
.uplink__list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 14rem;
  overflow-y: auto;
}
.uplink__entry {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 0.625rem;
  padding: 0.375rem 0;
  border-top: 1px solid var(--line);
  font-size: 0.75rem;
  line-height: 1.4;
}
.uplink__time {
  font-family: var(--font-mono);
  color: var(--muted);
}
.uplink__state {
  grid-column: 2;
  font-family: var(--font-mono);
  color: var(--signal-text);
}
.uplink__state--queued {
  color: var(--alert);
}
.uplink__dialog {
  width: min(26rem, 92vw);
}
</style>
