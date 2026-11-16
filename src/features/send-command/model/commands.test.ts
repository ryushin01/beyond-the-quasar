import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { acknowledgementDelayMs, simulateUplink, useCommandLog, type CommandRequest, type CommandResult } from './commands'

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

  it('저장된 기록이 깨졌거나 이전 형식이면 그 줄만 버리고 화면이 깨지지 않는다', () => {
    const good: CommandResult = { id: 'a', sentAt: '2026-11-16T00:00:00.000Z', state: 'ack', latencyMs: 710, noradId: 25544, satelliteName: 'ISS', command: 'ping', note: '', rangeKm: 1000 }
    localStorage.setItem('btq:command-log', JSON.stringify([good, { id: 'b', command: 'self-destruct' }, 'x']))
    const log = useCommandLog()
    expect(log.entries).toEqual([good])
    log.add({ ...good, id: 'c' })
    expect(log.entries.map((entry) => entry.id)).toEqual(['c', 'a'])
  })

  it('저장된 값이 배열이 아니면 빈 기록으로 시작한다', () => {
    localStorage.setItem('btq:command-log', '{"entries":[]}')
    const log = useCommandLog()
    expect(log.entries).toEqual([])
    expect(() => log.add({ ...request, id: 'd', sentAt: new Date().toISOString(), state: 'queued', latencyMs: null })).not.toThrow()
  })
})
