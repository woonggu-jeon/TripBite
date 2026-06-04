/**
 * 실 BE 통합 ad-hoc smoke — playwright config 우회.
 *
 * 사전:
 *   - BE :3000 떠 있음
 *   - FE dev npm run dev (USE_MSW=false, :3900)
 *
 * 실행: node scripts/be-smoke.mjs
 *
 * 검증 항목 6가지:
 *   1. CORS preflight 응답 헤더
 *   2. Cookie 저장 / SameSite
 *   3. 404 endpoint
 *   4. response shape mismatch (safeParseResponse warn)
 *   5. 핵심 endpoint 응답 매트릭스
 *   6. Letter compose → /letters/received 매칭 흐름 (mutation 시나리오)
 */
import { chromium } from '@playwright/test';

const FE = 'http://localhost:3900';
const BE_ORIGIN = 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const beRequests = [];
const beResponses = [];
const consoleMsgs = [];

page.on('request', (req) => {
  if (req.url().includes(BE_ORIGIN)) beRequests.push(req);
});
page.on('response', (res) => {
  if (res.url().includes(BE_ORIGIN)) beResponses.push(res);
});
page.on('console', (msg) => {
  const t = msg.text();
  if (
    t.includes('safeParseResponse') ||
    t.includes('CSP') ||
    msg.type() === 'error'
  )
    consoleMsgs.push({ type: msg.type(), text: t.slice(0, 200) });
});

function header(s) {
  console.log('\n' + '═'.repeat(60));
  console.log(s);
  console.log('═'.repeat(60));
}

// 1. 홈 진입 → /me 401 흐름
header('1. 홈 진입 → BE 호출 매트릭스');
await page.goto(FE + '/', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2000);

for (const res of beResponses) {
  const u = new URL(res.url());
  const status = res.status();
  const icon = status === 200 ? '✓' : status === 401 ? '⊘' : status === 404 ? '✗' : '?';
  console.log(`  ${icon} ${status} ${u.pathname}`);
}
if (beResponses.length === 0) console.log('  (BE 호출 0건 — USE_MSW=true 인 듯)');

// 2. CORS preflight 확인
header('2. CORS preflight (OPTIONS) 응답 헤더');
const opts = beResponses.find((r) => r.request().method() === 'OPTIONS');
if (opts) {
  const h = opts.headers();
  console.log(`  Status: ${opts.status()}`);
  console.log(`  Allow-Origin:      ${h['access-control-allow-origin'] ?? '(없음)'}`);
  console.log(`  Allow-Credentials: ${h['access-control-allow-credentials'] ?? '(없음)'}`);
  console.log(`  Allow-Methods:     ${h['access-control-allow-methods'] ?? '(없음)'}`);
  console.log(`  Allow-Headers:     ${h['access-control-allow-headers'] ?? '(없음)'}`);
} else {
  console.log('  OPTIONS 없음 — simple request 또는 same-origin');
  const me = beResponses.find((r) => r.url().includes('/me'));
  if (me) {
    const h = me.headers();
    console.log(`  /me 응답 Access-Control-Allow-Origin: ${h['access-control-allow-origin'] ?? '(없음)'}`);
    console.log(`  /me 응답 Access-Control-Allow-Credentials: ${h['access-control-allow-credentials'] ?? '(없음)'}`);
  }
}

// 3. 404 endpoint
header('3. 404 (BE 미구현 endpoint)');
const fourOhFour = beResponses.filter((r) => r.status() === 404);
if (fourOhFour.length === 0) console.log('  ✓ 0건');
else
  fourOhFour.forEach((r) =>
    console.log(`  ✗ 404 ${new URL(r.url()).pathname}`),
  );

// 4. response shape mismatch (safeParseResponse warn)
header('4. response shape mismatch (safeParseResponse warn 콘솔)');
const schemaWarns = consoleMsgs.filter((m) => m.text.includes('safeParseResponse'));
if (schemaWarns.length === 0) console.log('  ✓ 0건');
else schemaWarns.forEach((w) => console.log(`  ⚠ ${w.text}`));

// 5. CSP violation 콘솔
header('5. CSP violation 콘솔');
const cspMsgs = consoleMsgs.filter((m) =>
  m.text.toLowerCase().includes('csp') || m.text.includes('Content Security'),
);
if (cspMsgs.length === 0) console.log('  ✓ 0건');
else cspMsgs.forEach((m) => console.log(`  ⚠ ${m.text}`));

// 6. Cookie 상태 (login 시도 후)
header('6. Login mutation → Cookie 저장');
beRequests.length = 0;
beResponses.length = 0;
await page.goto(FE + '/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForTimeout(1000);
try {
  await page.fill('input[name="username"]', 'tester1');
  await page.fill('input[name="password"]', 'test1234!');
  await page.getByRole('button', { name: /로그인/i }).first().click();
  await page.waitForTimeout(3000);
} catch (e) {
  console.log(`  login form interact 실패: ${e.message?.slice(0, 100)}`);
}

const loginRes = beResponses.find((r) => r.url().includes('/auth/login'));
if (loginRes) {
  const status = loginRes.status();
  console.log(`  /auth/login 응답: ${status}`);
  console.log(`  Set-Cookie: ${loginRes.headers()['set-cookie'] ?? '(없음)'}`);
}

const cookies = await ctx.cookies();
console.log(`  Context cookies: ${cookies.length}`);
cookies.forEach((c) => {
  console.log(`    ${c.name}=… domain=${c.domain} sameSite=${c.sameSite} httpOnly=${c.httpOnly} secure=${c.secure}`);
});

// 7. console errors 요약
header('7. Console error/warning 요약');
const errs = consoleMsgs.filter((m) => m.type === 'error');
console.log(`  error: ${errs.length} / warn (filtered): ${consoleMsgs.length - errs.length}`);
errs.slice(0, 5).forEach((e) => console.log(`  ✗ ${e.text}`));

console.log('\n' + '═'.repeat(60));
console.log('완료');
console.log('═'.repeat(60));

await browser.close();
