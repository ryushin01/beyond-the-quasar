export const ROUTES = {
  home: '/',
  control: '/control',
  catalog: '/catalog',
  observatory: '/observatory',
  event: '/event',
} as const

/** 컴포넌트 문서 주소. 개발 중에는 `bun run story:dev`, 배포본에서는 함께 올린 정적 빌드로 연결합니다. */
export const HISTOIRE_URL: string = import.meta.env.VITE_HISTOIRE_URL ?? (import.meta.env.DEV ? 'http://localhost:6006/' : '/histoire/index.html')
