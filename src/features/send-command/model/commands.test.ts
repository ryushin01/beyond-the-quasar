import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { acknowledgementDelayMs, simulateUplink, useCommandLog, type CommandRequest } from './commands'

const request: CommandRequest = { noradId: 25544, satelliteName: 'ISS', command: 'ping', note: '', rangeKm: 1000 }
const noWait = async (): Promise<void> => {}

describe('시뮬레이션 명령', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('지연은 왕복 전파 시간과 처리 시간의 합이다', () => {
    expect(acknowledgementDelayMs(0)).toBe(700)
    // 정지궤도 거리 약 36,000km: 왕복 240ms
    expect(acknowledgementDelayMs(36_000)).toBe(940)
  })

  it('교신 범위 안이면 수신 확인, 밖이면 대기', async () => {
    const ack = await simulateUplink(request, noWait as never)
    expect(ack.state).toBe('ack')
    expect(ack.latencyMs).toBe(acknowledgementDelayMs(1000))
    const queued = await simulateUplink({ ...request, rangeKm: null }, noWait as never)
    expect(queued.state).toBe('queued')
    expect(queued.latencyMs).toBeNull()
  })

  it('기록은 최신순이고 30개까지 저장한다', async () => {
    const log = useCommandLog()
    const result = await simulateUplink(request, noWait as never)
    for (let i = 0; i < 35; i += 1) log.add({ ...result, id: String(i) })
    expect(log.entries).toHaveLength(30)
    expect(log.entries[0]?.id).toBe('34')
    log.clear()
    expect(log.entries).toEqual([])
  })
})
