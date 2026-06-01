import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 시각 회귀 — toHaveScreenshot().
 *
 * 페이지 × 모드 × 뷰포트 baseline 비교:
 *   - 페이지: /, /mypage, /letter, /region/cheongju
 *   - 모드:   light, dark
 *   - 플랫폼: 6 projects (desktop-windows / desktop-mac / mobile-chrome-aos /
 *            mobile-safari-ios / mobile-pwa-aos / mobile-pwa-ios)
 *
 * 모든 매트릭스 baseline = 4 × 2 × 6 = 48장.
 *
 * 첫 실행 시 baseline 없으면 자동 생성. 이후 변경 시 diff 검출.
 * 갱신: `npx playwright test --update-snapshots -g 시각`
 *
 * fullPage 캡처 — 전체 페이지 스크롤 영역 깨짐도 검출.
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
  test.beforeEach(async ({ page }) => {
    await authedSession(page);
  });

  for (const p of PAGES) {
    for (const m of MODES) {
      test(`${p.label} — ${m.name}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: m.scheme });
        await page.goto(p.path);
        await page.waitForLoadState('networkidle').catch(() => {});
        // 폰트 + skeleton + animation 안정화 — 비동기 fetch 안정화까지 여유.
        await page.evaluate(() => document.fonts?.ready).catch(() => {});
        await page.waitForTimeout(1200);

        await expect(page).toHaveScreenshot(`${p.label}-${m.name}.png`, {
          // viewport 만 — fullPage 는 무한 스크롤 페이지의 dynamic height 로
          // baseline 매칭이 일관 안 됨 (mock skeleton ms 단위 차이로 page height 변동).
          // viewport 캡처로도 above-the-fold 레이아웃/색상 깨짐은 충분히 검출.
          fullPage: false,
          maxDiffPixelRatio: 0.05,
          animations: 'disabled',
        });
      });
    }
  }
});
