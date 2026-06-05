/**
 * 비로그인 사용자 흐름 검증.
 * 사전: BE :3000 + FE dev :3900 (USE_MSW=false)
 */
import { chromium } from '@playwright/test';

const FE = 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const navHistory = [];
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) navHistory.push(frame.url());
});

// 1. 메인 진입 — 머물러야 함 (또는 /onboarding 으로 — onboarding 정책)
console.log('━ 1. 비로그인 + 메인 (/) 진입');
await page.goto(FE + '/', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2000);
console.log(`   최종 URL: ${page.url()}`);
console.log(`   탐색 이력: ${navHistory.map((u) => new URL(u).pathname).join(' → ')}`);

// 2. /region 진입 — 비로그인 OK
navHistory.length = 0;
console.log('\n━ 2. 비로그인 + /region (시군 목록) 진입');
await page.goto(FE + '/region', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1500);
console.log(`   최종 URL: ${page.url()}`);
console.log(`   탐색 이력: ${navHistory.map((u) => new URL(u).pathname).join(' → ')}`);

// 3. /mypage 진입 — 보호 경로 → /login redirect
navHistory.length = 0;
console.log('\n━ 3. 비로그인 + /mypage (보호 경로) 진입');
await page.goto(FE + '/mypage', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1500);
console.log(`   최종 URL: ${page.url()}`);
console.log(`   탐색 이력: ${navHistory.map((u) => new URL(u).pathname).join(' → ')}`);

// 4. /quiz 진입 — 비로그인 OK
navHistory.length = 0;
console.log('\n━ 4. 비로그인 + /quiz 진입');
await page.goto(FE + '/quiz', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1500);
console.log(`   최종 URL: ${page.url()}`);
console.log(`   탐색 이력: ${navHistory.map((u) => new URL(u).pathname).join(' → ')}`);

// 5. /tournament 진입 — 비로그인 OK
navHistory.length = 0;
console.log('\n━ 5. 비로그인 + /tournament (setup) 진입');
await page.goto(FE + '/tournament', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1500);
console.log(`   최종 URL: ${page.url()}`);
console.log(`   탐색 이력: ${navHistory.map((u) => new URL(u).pathname).join(' → ')}`);

await browser.close();
console.log('\n완료');
