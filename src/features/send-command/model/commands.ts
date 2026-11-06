import { useMutation } from '@tanstack/vue-query'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { readStorage, writeStorage } from '@/shared/lib'

export const COMMANDS = ['ping', 'downlink', 'attitude-hold', 'safe-mode'] as const
export type CommandType = (typeof COMMANDS)[number]

export interface CommandRequest {
  noradId: number
  satelliteName: string
  command: CommandType
  note: string
  /** 전송 시점의 지상국-위성 거리(km). 교신 범위 밖이면 null */
  rangeKm: number | null
}

export interface CommandResult extends CommandRequest {
  id: string
  sentAt: string
  state: 'ack' | 'queued'
  latencyMs: number | null
}

const SPEED_OF_LIGHT_KM_S = 299_792
const STORAGE_KEY = 'btq:command-log'
const LOG_LIMIT = 30
/** 온보드 처리 시간(시뮬레이션) */
const PROCESSING_MS = 700

/** 왕복 전파 시간 + 온보드 처리 시간 */
export function acknowledgementDelayMs(rangeKm: number): number {
  return Math.round(((2 * rangeKm) / SPEED_OF_LIGHT_KM_S) * 1000 + PROCESSING_MS)
}

/** 실제 전송은 없습니다. 거리로 계산한 지연 뒤 응답을 돌려줍니다. */
export async function simulateUplink(request: CommandRequest, wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))): Promise<CommandResult> {
  const delay = request.rangeKm === null ? 300 : acknowledgementDelayMs(request.rangeKm)
  await wait(delay)
  return {
    ...request,
    id: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
    state: request.rangeKm === null ? 'queued' : 'ack',
    latencyMs: request.rangeKm === null ? null : delay,
  }
}

export const useCommandLog = defineStore('command-log', () => {
  const entries = ref<CommandResult[]>(readStorage(STORAGE_KEY, []))
  watch(entries, (value) => writeStorage(STORAGE_KEY, value), { deep: true })

  function add(entry: CommandResult): void {
    entries.value = [entry, ...entries.value].slice(0, LOG_LIMIT)
  }
  function clear(): void {
    entries.value = []
  }
  return { entries, add, clear }
})

export function useSendCommand() {
  const log = useCommandLog()
  return useMutation({
    mutationFn: (request: CommandRequest) => simulateUplink(request),
    onSuccess: (result) => log.add(result),
  })
}
