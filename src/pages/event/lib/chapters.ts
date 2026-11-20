/** 이벤트 화면의 장(章). 이 순서로 스크롤하고, 장마다 이동할 수 있는 구역 id를 둡니다. */
export const CHAPTERS = ['signal', 'calendar', 'horizon', 'return'] as const

export type Chapter = (typeof CHAPTERS)[number]

export const sectionId = (chapter: Chapter): string => `event-${chapter}`
