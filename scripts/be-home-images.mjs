/**
 * 홈 (RecommendationBanner + FestivalCarousel) + region 상세 이미지 검증.
 */
import { chromium } from '@playwright/test';
const FE = 'http://localhost:3900';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
await ctx.addInitScript(() =>
  localStorage.setItem('tripbite.onboarded', 'true'),
);
const page = await ctx.newPage();

const imgSrcs = [];
page.on('request', (req) => {
  if (req.resourceType() === 'image') imgSrcs.push(req.url());
});

console.log('━ 1. 홈 진입 — 오늘의 추천 + 축제');
await page.goto(FE + '/', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2500);
const homeTongImgs = imgSrcs.filter((u) =>
  decodeURIComponent(u).includes('tong.visitkorea'),
);
console.log(`   TourAPI 이미지 요청: ${homeTongImgs.length}건`);

console.log('\n━ 2. 시군 상세 (cheongju) — RegionContentRow 카드');
imgSrcs.length = 0;
await page.goto(FE + '/region/cheongju', { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(2500);
const regionTongImgs = imgSrcs.filter((u) =>
  decodeURIComponent(u).includes('tong.visitkorea'),
);
console.log(`   TourAPI 이미지 요청: ${regionTongImgs.length}건`);

await browser.close();
console.log('\n완료');
