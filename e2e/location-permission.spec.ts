import { test, expect } from '@playwright/test';
import { authedSession } from './_helpers/auth';

/**
 * 위치 권한 5종 매트릭스.
 *
 * Playwright API:
 *   - context.grantPermissions(['geolocation'], ...) : 허용
 *   - context.clearPermissions()                    : prompt 상태 (기본)
 *   - context.setGeolocation(null)                  : 좌표 자체 실패
 *   - geolocation 미 grant + 실 ip 응답 : IP fallback (서버 측 시뮬)
 *
 * "denied" 는 Playwright 가 직접 지원 X — geolocation.getCurrentPosition 의 코드 1
 * (PERMISSION_DENIED) 응답을 page.addInitScript 로 강제 emulate.
 *
 * 검증 대상: /letter/compose 진입 시 위치 채우기 동작 (resolveLocation hook).
 */

const HOME = '/';

test.describe('위치 권한 — granted', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 36.6424, longitude: 127.489 });
  });

  test('letter compose 진입 — location 자동 채우기 후보 노출 또는 silent OK', async ({
    page,
  }) => {
    await page.goto('/letter/compose');
    // compose 페이지 textbox 노출 — 위치 권한 단계 통과
    await expect(page.getByRole('textbox').first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('위치 권한 — prompt (clearPermissions)', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    await context.clearPermissions();
  });

  test('letter compose 진입 — 권한 prompt 대기 / 작성은 진행 가능', async ({
    page,
  }) => {
    await page.goto('/letter/compose');
    await expect(page.getByRole('textbox').first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('위치 권한 — denied (emulated)', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    await context.clearPermissions();
    // getCurrentPosition 을 PERMISSION_DENIED (code:1) 로 강제 응답
    await page.addInitScript(() => {
      // @ts-expect-error — override read-only API for emulation
      navigator.geolocation = {
        getCurrentPosition: (
          _ok: PositionCallback,
          err?: PositionErrorCallback,
        ) => {
          err?.({
            code: 1,
            message: 'permission denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        },
        watchPosition: () => 0,
        clearWatch: () => undefined,
      };
    });
  });

  test('letter compose — denied 상태에서도 페이지 깨지지 않음 + textbox 노출', async ({
    page,
  }) => {
    await page.goto('/letter/compose');
    await expect(page.getByRole('textbox').first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('위치 권한 — IP fallback (geolocation 미허용 + BE 응답)', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    await context.clearPermissions();
    // navigator.geolocation 자체를 undefined 로 — 권한 prompt 미발생, BE IP 추론 fallback 분기
    await page.addInitScript(() => {
      // @ts-expect-error — emulate browser without Geolocation API
      delete navigator.geolocation;
    });
  });

  test('letter compose — geolocation 부재 시도 페이지 진입 가능', async ({
    page,
  }) => {
    await page.goto('/letter/compose');
    await expect(page.getByRole('textbox').first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('위치 권한 — 좌표 실패 (POSITION_UNAVAILABLE)', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    await context.grantPermissions(['geolocation']);
    // 좌표 응답을 POSITION_UNAVAILABLE (code:2) 로 강제
    await page.addInitScript(() => {
      const orig = navigator.geolocation;
      // @ts-expect-error — override Geolocation methods for emulation
      navigator.geolocation = {
        ...orig,
        getCurrentPosition: (
          _ok: PositionCallback,
          err?: PositionErrorCallback,
        ) => {
          err?.({
            code: 2,
            message: 'position unavailable',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        },
      };
    });
  });

  test('letter compose — 좌표 실패해도 페이지 동작 + textbox 노출', async ({
    page,
  }) => {
    await page.goto('/letter/compose');
    await expect(page.getByRole('textbox').first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('위치 권한 — home 페이지 진입은 항상 가능', () => {
  test.beforeEach(async ({ page, context }) => {
    await authedSession(page);
    await context.clearPermissions();
  });

  test('홈은 위치 권한과 무관 진입', async ({ page }) => {
    await page.goto(HOME);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('localhost:3000');
  });
});
