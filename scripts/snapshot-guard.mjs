const MIN_SATELLITES = 100

/** 스냅샷을 저장하면 안 되는 이유를 돌려줍니다. 문제가 없으면 null입니다. */
export function findSnapshotProblem(satellites, failures) {
  if (failures.length > 0) return `요청 실패 ${failures.length}건: ${failures.slice(0, 3).join(', ')}`
  if (satellites.length < MIN_SATELLITES) return `위성이 너무 적습니다: ${satellites.length}기`
  if (!satellites.some((item) => item.category === 'military')) return '군사 위성이 없습니다'
  return null
}
