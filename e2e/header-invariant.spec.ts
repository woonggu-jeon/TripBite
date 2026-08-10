import { expect, test } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 헤더 불변식 — 라우트당 h1 최대 1개.
 *
 * 배경: 마이페이지가 page.tsx(server) + MyPageClient(client) 양쪽에서 SubHeader 를
 * 렌더해 헤더/h1 이 2개로 겹쳐 보이던 회귀(스타일 머지 잔재). 기존 스모크 e2e 는
 * "내용 렌더 + 키워드 존재"만 봐서 구조적 중복을 못 잡았다 → 이 불변식으로 방어.
 *
 * 규칙: (main) 라우트는 SubHeader(h1 1개) 또는 홈 AppHeader(h1 0개)만 → h1 ≤ 1.
 * 2개 이상이면 헤더가 중복 렌더된 것.
 */
const ROUTES = [
  '/',
  '/ranking',
  '/tournament',
  '/letter',
  '/letter/compose',
  '/mypage',
  '/mypage/stamps',
  '/mypage/saved-tournaments',
  '/settings',
  '/notifications',
];

test.describe('헤더 불변식 — 라우트당 h1 ≤ 1 (헤더 중복 금지)', () => {
  test.beforeEach(async ({ page }) => {
    await authedSession(page);
  });

  for (const path of ROUTES) {
    test(`${path} — h1 최대 1개`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      // 하이드레이션 후 클라 헤더까지 렌더된 상태에서 카운트.
      await expect(async () => {
        const count = await page.locator('h1').count();
        expect(count, `${path} h1 개수=${count}`).toBeLessThanOrEqual(1);
      }).toPass({ timeout: 8000 });
    });
  }
});
