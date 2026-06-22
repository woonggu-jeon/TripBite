#!/usr/bin/env node
/**
 * Favicon / app icon 일괄 생성.
 *
 * 입력: public/images/auth/trip-bite-logo.svg (디자이너 신규 로고)
 * 출력: public/icons/*.png + public/favicon.ico (PNG)
 *
 * 실행: npm run gen:favicon
 *
 * 디자인:
 *   - 배경 #ffffff
 *   - 로고는 캔버스의 70% (좌우 여백 15%)
 *   - 모든 사이즈 동일 비율 (디자이너 source SVG 자체가 square aspect)
 *
 * 출력 사이즈 매트릭스:
 *   - 32x32         : Chrome/Firefox favicon
 *   - 180x180       : iOS Safari apple-touch-icon
 *   - 192x192       : Android PWA launcher (manifest.json)
 *   - 512x512       : Android PWA splash 자동 생성 source + maskable
 *
 * favicon.ico 대안: 본 스크립트는 32x32 PNG 를 .ico 확장자로도 저장
 * (modern 브라우저 PNG-as-ICO 호환). 진짜 ICO 멀티 사이즈 필요 시 별도 도구.
 */
import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = resolve(ROOT, 'public/images/auth/trip-bite-logo.svg');
const BACKGROUND = '#ffffff';

const OUTPUTS = [
  { name: 'favicon-32x32.png', size: 32, dir: 'public/icons' },
  { name: 'apple-touch-icon.png', size: 180, dir: 'public/icons' },
  { name: 'icon-192x192.png', size: 192, dir: 'public/icons' },
  { name: 'icon-512x512.png', size: 512, dir: 'public/icons' },
];

await mkdir(resolve(ROOT, 'public/icons'), { recursive: true });

for (const out of OUTPUTS) {
  const outPath = resolve(ROOT, out.dir, out.name);
  // 로고가 캔버스의 70% — 좌우 15% 여백. fit:contain + background #ffffff.
  const padding = Math.round(out.size * 0.15);
  const innerSize = out.size - padding * 2;

  const inner = await sharp(SOURCE)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: out.size,
      height: out.size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outPath);

  console.log(`  ${out.name}  (${out.size}x${out.size})`);
}

// favicon.ico (root) — 32x32 PNG 를 .ico 확장자로 복사. modern 브라우저 OK.
const ico = resolve(ROOT, 'public/favicon.ico');
await copyFile(resolve(ROOT, 'public/icons/favicon-32x32.png'), ico);
console.log(`  favicon.ico  (root, 32x32 PNG)`);

console.log(`\n[ok] favicons → public/icons/ + public/favicon.ico`);
