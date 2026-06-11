/**
 * 첫 방문자 + onboarded 완료자 분기 동작 검증.
 */
import { chromium } from '@playwright/test';

const FE = process.env.FE_URL ?? 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });

// 1. 첫 방문자 (localStorage 비어있음) → onboarding redirect
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  console.log('━ 1. 첫 방문자 (localStorage 비어있음)');
  await page.goto(FE + '/', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log(`   / 진입 → 최종 URL: ${page.url()}`);
  await ctx.close();
}

// 2. onboarded=true 후 / 진입 → 머묾
{
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    localStorage.setItem('tripbite.onboarded', 'true');
  });
  const page = await ctx.newPage();
  console.log('\n━ 2. onboarded=true 후 다양한 페이지');
  for (const path of ['/', '/region', '/quiz', '/tournament', '/ranking']) {
    await page.goto(FE + path, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(800);
    const url = new URL(page.url()).pathname;
    const ok = url === path ? '✓' : '✗';
    console.log(`   ${ok} ${path} → ${url}`);
  }
  await ctx.close();
}

// 3. onboarded=true + /mypage → /login redirect (보호 경로)
{
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    localStorage.setItem('tripbite.onboarded', 'true');
  });
  const page = await ctx.newPage();
  console.log('\n━ 3. onboarded=true + /mypage');
  await page.goto(FE + '/mypage', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1000);
  console.log(`   /mypage 진입 → ${page.url()}`);
  await ctx.close();
}

await browser.close();
console.log('\n완료');
