import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 시각 회귀 — toHaveScreenshot().
 *
 * 페이지 × 모드 × 뷰포트 baseline 비교:
 *   - 페이지: /, /mypage, /letter, /region/cheongju
 *   - 모드:   light, dark (prefers-color-scheme)
 *   - 뷰포트: project 별 자동 (desktop / mobile)
 *
 * 의도적 mask:
 *   - 상대 시간 ("3분 전") / 절대 날짜
 *   - 카운트 ("3 / 11") — stamps 진행률 등 mock 의존
 *
 * 첫 실행 시 baseline 이 없으면 자동 생성 (test 통과). 이후 변경 시 diff 검출.
 * 갱신: `npx playwright test --update-snapshots --project=desktop-chrome -g 시각`
 *
 * 모바일 매트릭스도 같이 돌리면 baseline 폭증 — 우선 desktop-chrome 만.
 */

const PAGES: { path: string; label: string }[] = [
  { path: '/', label: 'home' },
  { path: '/mypage', label: 'mypage' },
  { path: '/letter', label: 'letter' },
  { path: '/region/cheongju', label: 'region-cheongju' },
];

const MODES = [
  { name: 'light', scheme: 'light' as const },
  { name: 'dark', scheme: 'dark' as const },
];

test.describe('시각 회귀 — toHaveScreenshot', () => {
  // 시각 회귀는 desktop-chrome 만 — 모바일까지 확장하면 baseline × 4 projects.
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      '시각 회귀는 desktop-chrome 만',
    );
    await authedSession(page);
  });

  for (const p of PAGES) {
    for (const m of MODES) {
      test(`${p.label} — ${m.name}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: m.scheme });
        await page.goto(p.path);
        await page.waitForLoadState('networkidle').catch(() => {});
        // skeleton / 애니메이션 안정화 — 비동기 fetch 안정화까지 여유.
        await page.waitForTimeout(800);

        await expect(page).toHaveScreenshot(`${p.label}-${m.name}.png`, {
          fullPage: false,
          // 5% 픽셀 차이 허용 — 상대시간/카운트/skeleton timing 오차 흡수.
          // 레이아웃/색상 깨짐은 충분히 검출됨 (전체 viewport 의 5% 이상은 큰 변경).
          maxDiffPixelRatio: 0.05,
          // 마스크 — 후속 PR 에서 time / stamp-progress 에 data-testid 부여 시 활성화.
          animations: 'disabled',
        });
      });
    }
  }
});
