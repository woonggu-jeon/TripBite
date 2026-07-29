import nextJest from 'next/jest.js';

/**
 * Jest 설정 — **vitest 와 병행**.
 *
 * 이 저장소의 기본 테스트 러너는 vitest(`npm test`). jest 는 별도로 공존하며,
 * **중복 실행/충돌 방지**를 위해 `*.jest.test.{ts,tsx}` 파일만 담당한다.
 * (vitest 는 vitest.config.ts 의 exclude 로 `*.jest.test.*` 를 제외)
 *
 * next/jest: SWC transform + CSS module 스텁 + 이미지/폰트 스텁을 자동 구성.
 * 실행: `npm run test:jest`
 */
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // tsconfig paths(@/*) 매핑 — next/jest 는 CSS/이미지만 매핑하므로 alias 는 명시.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // jest 담당 범위 — vitest 와 겹치지 않게 `.jest.test` 접미사만.
  testMatch: ['**/*.jest.test.{ts,tsx}'],
  clearMocks: true,
};

export default createJestConfig(config);
