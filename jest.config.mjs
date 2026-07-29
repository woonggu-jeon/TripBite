import nextJest from 'next/jest.js';

/**
 * Jest 설정 — **역할 분담: 순수 로직 유틸(node 환경) 단위 테스트**.
 *
 * 테스트 러너 분담:
 *   - **jest**  : 순수 로직(DOM/React/MSW 불필요) 유틸 — node 환경, 빠름.
 *                 대상: `*.jest.test.{ts,tsx}` (logger / secure-image-url / csp /
 *                 validation / shuffle-options 등).
 *   - **vitest**: React 컴포넌트·훅·MSW 통합·브라우저(happy-dom) 테스트 (`*.test.{ts,tsx}`).
 *
 * vitest 는 vitest.config.ts 의 exclude 로 `*.jest.test.*` 를 제외 → 중복 실행 없음.
 * next/jest: SWC transform + CSS/이미지 스텁 자동 구성. 실행: `npm run test:jest`.
 */
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  // 순수 로직 대상 — DOM 불필요(React/DOM 테스트는 vitest 담당).
  testEnvironment: 'node',
  // tsconfig paths(@/*) 매핑 — next/jest 는 CSS/이미지만 매핑하므로 alias 는 명시.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // jest 담당 범위 — vitest 와 겹치지 않게 `.jest.test` 접미사만.
  testMatch: ['**/*.jest.test.{ts,tsx}'],
  clearMocks: true,
  // `jest --coverage` 측정 대상(순수 유틸). logger 는 browser-write 경로가 node 에서
  // 미실행이라 제외(측정 왜곡 방지). threshold 는 미강제 — 러너 역할 검증 우선.
  collectCoverageFrom: [
    'src/lib/secure-image-url.ts',
    'src/lib/csp.ts',
    'src/lib/validation.ts',
    'src/features/ranking/utils/shuffle-options.ts',
  ],
};

export default createJestConfig(config);
