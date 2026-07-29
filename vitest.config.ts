import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

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
      // 테스트가 작성된 module 만 측정 대상 — 신규 test 추가 시 함께 갱신.
      // (전체 src/** 포함하면 test 없는 코드가 0% 로 평균 끌어내려 거짓 알람.
      // 명시 list 가 정직 — 어디까지 검증됐는지 명확.)
      include: [
        // lib (순수 함수 / 유틸)
        'src/lib/async.ts',
        'src/lib/json-ld.tsx',
        'src/lib/client-error-reporter.ts',
        'src/lib/clipboard.ts',
        'src/lib/csp.ts',
        'src/lib/secure-image-url.ts',
        'src/lib/sentry-scrub.ts',
        'src/lib/validation.ts',
        // hooks
        'src/hooks/use-format.ts',
        'src/hooks/use-responsive-slides-per-view.ts',
        'src/hooks/use-share-card.ts',
        // stores
        'src/stores/location-store.ts',
        'src/features/tournament/store/tournament-store.ts',
        // services
        'src/services/interceptors/error-normalize.ts',
        // schemas (zod)
        'src/features/**/schemas/**',
        // UI primitives
        'src/components/ui/Dialog.tsx',
        'src/components/ui/MediaThumb.tsx',
        'src/components/ui/RadioGroup.tsx',
        'src/components/ui/Tabs.tsx',
        'src/components/ui/TextField.tsx',
        // features (test 있는 module 한정)
        'src/features/auth/hooks/use-auth.ts',
        'src/features/letter/hooks/use-letters.ts',
        'src/features/mypage/hooks/use-mypage.ts',
        'src/features/notification/hooks/use-notification-inbox.ts',
        'src/features/notification/hooks/use-push-notification.ts',
        'src/features/ranking/hooks/use-ranking.ts',
        'src/features/ranking/utils/shuffle-options.ts',
        'src/features/region/hooks/use-region.ts',
        'src/features/settings/hooks/use-notification-settings.ts',
        'src/features/location/components/LocationPermissionPrompt.tsx',
        'src/features/tournament/hooks/use-tournament.ts',
        'src/features/tournament/utils/bracket.ts',
        'src/features/tournament/components/Bracket.tsx',
        'src/features/home/components/DdayBadge.tsx',
        'src/features/home/components/FestivalCarousel.tsx',
        'src/app/(main)/region/[code]/_components/RegionDetailTabs.tsx',
      ],
      // Threshold — 현실 baseline 의 5% 아래로 설정 (회귀 가드 + 일시적 측정 오차).
      // 2026-06-14 baseline (use-auth + use-letters test 추가 후):
      //   Stmts 87.1% / Branches 74.1% / Funcs 84.6% / Lines 88.5%.
      thresholds: {
        statements: 82,
        branches: 69,
        functions: 79,
        lines: 83,
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
      // jest 병행 — `*.jest.test.*` 는 jest 담당(중복 실행 방지)
      '**/*.jest.test.@(ts|tsx)',
    ],
    css: false,
  },
});
