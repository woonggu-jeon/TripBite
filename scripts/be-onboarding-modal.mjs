/**
 * OnboardingModal 표시 검증.
 * 사전: FE dev :3900 USE_MSW=false
 */
import { chromium } from '@playwright/test';

const FE = 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

console.log('━ 1. 첫 진입 (localStorage 비어있음)');
await page.goto(FE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const modalVisible1 = await page
  .locator('[role="dialog"][aria-label*="TripBite"]')
  .isVisible()
  .catch(() => false);
console.log(`   modal 표시: ${modalVisible1}`);
console.log(`   현재 URL: ${page.url()}`);

if (modalVisible1) {
  console.log('   "둘러보기 시작" 클릭');
  await page.getByRole('button', { name: /둘러보기 시작|Start/ }).click();
  await page.waitForTimeout(800);
  const after = await page
    .locator('[role="dialog"][aria-label*="TripBite"]')
    .isVisible()
    .catch(() => false);
  console.log(`   닫힘 확인: modal 표시=${after}`);
  console.log(`   페이지 그대로: ${page.url()}`);
}

console.log('\n━ 2. 같은 컨텍스트 다른 페이지 진입 (이미 본 사용자)');
await page.goto(FE + '/region', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const modalVisible2 = await page
  .locator('[role="dialog"][aria-label*="TripBite"]')
  .isVisible()
  .catch(() => false);
console.log(`   modal 표시: ${modalVisible2} (false 여야 정상)`);

console.log('\n━ 3. localStorage clear 후 다시 첫 진입');
await page.evaluate(() => localStorage.removeItem('tripbite.onboarded'));
await page.goto(FE + '/quiz', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const modalVisible3 = await page
  .locator('[role="dialog"][aria-label*="TripBite"]')
  .isVisible()
  .catch(() => false);
console.log(`   modal 재표시: ${modalVisible3}`);

console.log('\n━ 4. "자세히 보기" 클릭 → /onboarding 진입');
if (modalVisible3) {
  await page.getByRole('button', { name: /자세히 보기|Learn more/ }).click();
  await page.waitForTimeout(1500);
  console.log(`   이동 URL: ${page.url()}`);
}

await browser.close();
console.log('\n완료');
