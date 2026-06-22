#!/usr/bin/env node
/**
 * iOS PWA splash 이미지 일괄 생성.
 *
 * 배경: iOS Safari 는 manifest 의 background_color/icons 로 splash 자동 생성
 * 안 함. 디바이스별 PNG + apple-touch-startup-image link 필요.
 *
 * 입력: public/icons/icon-512x512.png (source 로고)
 * 출력: public/splash/*.png (디바이스별 사이즈)
 *
 * 실행: node scripts/generate-ios-splash.mjs
 *       또는 npm run gen:splash (package.json scripts 등록 시)
 *
 * 디자인:
 *   - 배경: --color-bg light (#ffffff) — manifest.background_color 정합
 *   - 로고: 캔버스 short-edge 의 40% width center 배치
 *
 * 디바이스별 link tag 는 src/app/layout.tsx 에 통합. 디바이스 매트릭스 추가/
 * 변경 시 본 스크립트의 DEVICES + layout.tsx 의 link 동시 갱신.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// 디자이너 Figma SPLASH 노드의 trip-bite-logo SVG (2026-06-19) — Phase G.
// sharp 가 SVG → PNG 자동 raster. 이전 PNG (icon-512x512) 보다 brand 정합.
const SOURCE = resolve(ROOT, 'public/images/auth/trip-bite-logo.svg');
const OUT_DIR = resolve(ROOT, 'public/splash');
const BACKGROUND = '#ffffff';

/**
 * iOS 디바이스 portrait splash 사이즈 (자주 쓰는 13종).
 * media query 는 layout.tsx 에서 사용.
 */
const DEVICES = [
  { name: 'iphone-se', w: 750, h: 1334 },
  { name: 'iphone-8-plus', w: 1242, h: 2208 },
  { name: 'iphone-x-xs-11pro', w: 1125, h: 2436 },
  { name: 'iphone-xr-11', w: 828, h: 1792 },
  { name: 'iphone-11pro-max', w: 1242, h: 2688 },
  { name: 'iphone-12-mini', w: 1080, h: 2340 },
  { name: 'iphone-12-13-14', w: 1170, h: 2532 },
  { name: 'iphone-14-pro-max', w: 1284, h: 2778 },
  { name: 'iphone-15-pro-max', w: 1290, h: 2796 },
  { name: 'ipad-mini', w: 1536, h: 2048 },
  { name: 'ipad', w: 1620, h: 2160 },
  { name: 'ipad-pro-11', w: 1668, h: 2388 },
  { name: 'ipad-pro-12_9', w: 2048, h: 2732 },
];

await mkdir(OUT_DIR, { recursive: true });

const sourceBuffer = await sharp(SOURCE).png().toBuffer();

for (const d of DEVICES) {
  // 로고: short-edge 의 40% — 어느 디바이스에서도 자연스러운 비율.
  const logoSize = Math.round(Math.min(d.w, d.h) * 0.4);
  const logo = await sharp(sourceBuffer)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .toBuffer();

  const out = resolve(OUT_DIR, `${d.name}.png`);
  await sharp({
    create: {
      width: d.w,
      height: d.h,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([
      {
        input: logo,
        gravity: 'center',
      },
    ])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(out);

  console.log(`  ${d.name}.png  (${d.w}x${d.h})`);
}

console.log(`\n[ok] ${DEVICES.length} splash images → ${OUT_DIR}`);
