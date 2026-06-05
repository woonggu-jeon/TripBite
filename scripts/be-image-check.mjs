/**
 * BE ongoing-festivals 응답의 이미지 URL 정규화 검증.
 * 사전: BE :3000 + FE dev :3900 (USE_MSW=false)
 */
import { chromium } from '@playwright/test';

const FE = 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await ctx.addInitScript(() =>
  localStorage.setItem('tripbite.onboarded', 'true'),
);

const imgSrcs = [];
page.on('request', (req) => {
  if (req.resourceType() === 'image') imgSrcs.push(req.url());
});

const beResponses = [];
page.on('response', async (res) => {
  if (res.url().includes('ongoing-festivals')) {
    try {
      const body = await res.json();
      beResponses.push({
        status: res.status(),
        sample: body[0] ?? null,
        count: body.length ?? 0,
      });
    } catch {}
  }
});
const cspViolations = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (t.toLowerCase().includes('content security') || t.includes('CSP'))
    cspViolations.push(t.slice(0, 200));
});

console.log('━ destination 상세 진입 (RelatedDestinations 노출)');
await page
  .goto(FE + '/destination/tour-141236', { waitUntil: 'networkidle' })
  .catch(() => {});
await page.waitForTimeout(3000);
console.log(`   현재 URL: ${page.url()}`);

const tongImgs = imgSrcs.filter((u) => u.includes('tong.visitkorea.or.kr'));
console.log(`\n━ TourAPI 이미지 요청 ${tongImgs.length}건`);
tongImgs.slice(0, 5).forEach((u) => {
  const protocol = new URL(u.replace(/^.*?(http)/, '$1')).protocol;
  const icon = u.includes('https://') || u.includes('http%3A%2F%2F') === false ? '?' : '?';
  // Next/Image 가 한 번 wrapping — /_next/image?url= 형태
  const decoded = decodeURIComponent(u);
  console.log(`  ${decoded.slice(0, 130)}`);
});

const httpDirectly = tongImgs.filter(
  (u) => u.startsWith('http://tong.visitkorea'),
);
const nextOpt = tongImgs.filter((u) => u.includes('/_next/image'));
console.log(`\n━ 분석:`);
console.log(`  직접 http:// 호출: ${httpDirectly.length} (있으면 CSP 차단 위험)`);
console.log(`  Next/Image optimizer 경유: ${nextOpt.length}`);
console.log(`  CSP violation 로그: ${cspViolations.length}`);
cspViolations.slice(0, 3).forEach((v) => console.log(`    ! ${v}`));

await browser.close();
