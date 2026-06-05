/**
 * BE 의 ongoing-festivals 가 빈 응답 시 홈 화면에서 섹션 자체 미노출 검증.
 */
import { chromium } from '@playwright/test';

const FE = 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
await ctx.addInitScript(() =>
  localStorage.setItem('tripbite.onboarded', 'true'),
);
const page = await ctx.newPage();

await page.goto(FE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// section[data-widget="ongoing-festivals"] 존재 여부
const section = page.locator('section[data-widget="ongoing-festivals"]');
const exists = await section.count();
const headerVisible = await page.getByRole('heading', { name: /지금 열리는/ }).isVisible().catch(() => false);

console.log(`section[data-widget="ongoing-festivals"] 개수: ${exists}`);
console.log(`"지금 열리는" 헤딩 보임: ${headerVisible}`);
console.log(`기대: 둘 다 0 / false (BE 가 빈 응답 시 영역 자체 미노출)`);

await browser.close();
