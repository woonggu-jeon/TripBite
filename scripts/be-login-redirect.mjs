/**
 * 로그인 → mypage 이동 정밀 검증.
 */
import { chromium } from '@playwright/test';

const FE = 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

await ctx.addInitScript(() => {
  localStorage.setItem('tripbite.onboarded', 'true');
});

const traffic = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (
    t.includes('[useLogin]') ||
    t.includes('[loginform]') ||
    msg.type() === 'error'
  )
    console.log(`  console-${msg.type()}: ${t.slice(0, 200)}`);
});

page.on('request', (req) => {
  if (req.url().includes('localhost:3000')) {
    traffic.push({
      stage: 'req',
      method: req.method(),
      url: new URL(req.url()).pathname,
      cookie: req.headers().cookie ?? '(없음)',
    });
  }
});
page.on('response', async (res) => {
  if (res.url().includes('localhost:3000')) {
    const setCookie = res.headers()['set-cookie'];
    traffic.push({
      stage: 'res',
      status: res.status(),
      url: new URL(res.url()).pathname,
      setCookie: setCookie ?? '',
    });
  }
});

console.log('━ /mypage 진입');
await page.goto(FE + '/mypage', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

console.log(`현재 URL: ${page.url()}`);
console.log(`Cookies (context): ${(await ctx.cookies()).length}`);

console.log('\n━ 로그인 submit');
traffic.length = 0;
await page.fill('input[name="username"]', 'tester1');
await page.fill('input[name="password"]', 'test1234!');
await page.getByRole('button', { name: /로그인/ }).first().click();
await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(5000);

console.log('\n━ 트래픽:');
traffic.forEach((t) => {
  if (t.stage === 'req')
    console.log(
      `  → ${t.method} ${t.url}  cookie: ${t.cookie.slice(0, 80)}`,
    );
  else
    console.log(
      `  ← ${t.status} ${t.url}  set-cookie: ${t.setCookie ? '있음' : '(없음)'}`,
    );
});

console.log('\n━ 최종 cookies:');
const cookies = await ctx.cookies();
cookies.forEach((c) =>
  console.log(
    `  ${c.name} (domain=${c.domain}, path=${c.path}, sameSite=${c.sameSite}, httpOnly=${c.httpOnly})`,
  ),
);

console.log(`\n━ 최종 URL: ${page.url()}`);

await browser.close();
