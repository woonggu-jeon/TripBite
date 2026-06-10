import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { authedSession } from './_helpers/auth';

/**
 * a11y 자동 QA — axe-core 로 핵심 페이지의 WCAG 2.0/2.1 A/AA 위반 검출.
 *
 * 기준:
 *   - serious / critical 위반 0건 (운영 기준)
 *   - moderate / minor 는 reporter 에만 노출 (실패 X)
 *
 * 검사 범위:
 *   - WCAG 2.0 / 2.1 A / AA
 *   - color-contrast 는 standalone tag — 별 체크
 *
 * 의도적으로 제외 (false positive 가 많거나 dev 환경 한정):
 *   - region: 일부 PageSection 이 landmark 안에 중첩됨 (개선 예정)
 *   - duplicate-id-aria: dev mode 의 hot reload 잔재 (production 영향 X)
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function audit(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle').catch(() => {});
  // animation 안정화 — banner slide-down 등이 끝나야 axe 가 정확한 색 계산
  await page.waitForTimeout(800);
  return new AxeBuilder({ page })
    .withTags(TAGS)
    .disableRules([
      // dev mode hot reload 잔재 — production 영향 X
      'duplicate-id-aria',
      // 2026-06-02: spring / autumn / red / amber / green / violet 톤을
      // 어둡게 보강해 흰 배경 4.5:1+ 충족. color-contrast 활성.
      // 2026-06-04: region rule 활성화 — 모든 section 이 main / nav / aside
      // 같은 landmark 안 또는 aria-label 부여된 상태로 정리됨.
    ])
    .analyze();
}

const PAGES: { path: string; label: string }[] = [
  { path: '/', label: '홈' },
  { path: '/mypage', label: '마이페이지' },
  { path: '/mypage/stamps', label: '도장책' },
  { path: '/mypage/saved-tournaments', label: '저장한 우승지' },
  { path: '/letter', label: '편지' },
  { path: '/tournament', label: '토너먼트 setup' },
  { path: '/region', label: '시군 지도' },
  { path: '/region/cheongju', label: '시군 상세' },
  { path: '/ranking', label: '랭킹' },
  { path: '/quiz', label: '여행 유형 테스트' },
  { path: '/settings', label: '설정' },
  // seed id 체계: tour-<hash(rc-<region>-<type>-<idx>)>. cheongju attraction 1 hash = tour-5537321.
  { path: '/destination/tour-5537321', label: '여행지 상세' },
];

test.describe('a11y — serious/critical 위반 0건', () => {
  // axe-core 분석은 desktop 계열만 — webkit (mobile-safari/pwa) 의 일부 viewport
  // 의존 검사 결과가 다른 project 와 어긋나 noise. 디자인 sweep 후 모든 project 활성.
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('desktop'),
      'a11y 검사는 desktop 계열만',
    );
    await authedSession(page);
  });

  for (const p of PAGES) {
    test(`${p.label} (${p.path}) 위반 없음`, async ({ page }) => {
      const result = await audit(page, p.path);
      const fatal = result.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      if (fatal.length) {
        // eslint-disable-next-line no-console
        console.log(
          `[a11y] ${p.path} fatal violations:\n` +
            fatal
              .map(
                (v) =>
                  `  - ${v.id} (${v.impact}): ${v.help}\n    nodes: ${v.nodes.length}`,
              )
              .join('\n'),
        );
      }
      expect(fatal, `serious/critical 위반 ${fatal.length}건`).toEqual([]);
    });
  }
});
