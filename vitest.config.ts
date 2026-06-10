import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

/**
 * Vitest 설정
 *
 * 실행:
 *   npm test            watch 모드
 *   npm run test:run    1회 실행 (CI)
 *   npm run test:coverage  커버리지 리포트
 *
 * 환경:
 *   - happy-dom: jsdom보다 빠른 DOM (Vitest 공식 권장)
 *   - globals: describe/it/expect 전역 (import 불필요)
 *   - setupFiles: jest-dom 매처 + MSW server lifecycle
 *
 * e2e는 Playwright가 담당 → exclude로 분리.
 * Storybook story test 는 별도 검증 — build-storybook 통과 + Playwright 시각 회귀로 커버.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // *.module.scss import는 빈 객체로 처리 (스타일은 테스트 대상 아님)
    coverage: {
      provider: 'v8',
      // html reporter는 Windows에서 istanbul 경로 이슈(EINVAL) — text+json-summary로
      reporter: ['text', 'json-summary'],
      exclude: [
        'src/generated/**',
        'src/i18n/messages/**',
        '**/*.module.scss',
        '**/*.d.ts',
        'src/mocks/**',
      ],
      // 테스트가 작성된 핵심 로직만 측정 대상 — 위젯 stub은 분모 제외(구현 시 확장).
      include: [
        'src/features/**/schemas/**',
        'src/lib/csp.ts',
        'src/lib/sentry-scrub.ts',
        'src/lib/validation.ts',
        'src/lib/async.ts',
        'src/lib/clipboard.ts',
        'src/hooks/use-format.ts',
        'src/stores/location-store.ts',
        'src/features/location/components/LocationPermissionPrompt.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    environment: 'happy-dom',
    globals: true,
    // forks 풀 — 테스트 파일 간 모듈/전역 상태 격리 (MSW server, zustand store 등)
    pool: 'forks',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      'e2e/**',
      'node_modules/**',
      '.next/**',
      '**/*.stories.@(js|jsx|ts|tsx)',
    ],
    css: false,
  },
});
