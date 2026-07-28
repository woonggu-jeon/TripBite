#!/usr/bin/env node
/**
 * SVG Sprite 빌드 스크립트
 *
 * lucide-static 패키지에서 필요한 아이콘만 추출하여
 * 단일 sprite 파일 (public/icons.svg) 로 결합.
 *
 * 사용:
 *   npm i -D lucide-static
 *   npm run build:icons
 *
 * → public/icons.svg 생성
 * → <Icon name="home" /> 가 <use href="/icons.svg#home"> 로 참조
 *
 * 아이콘 추가/제거:
 *   ICONS 배열만 수정 후 재실행.
 *
 * 산출물 크기 예측:
 *   현재 ~20개 아이콘 ≒ 5KB (gzip)
 *   lucide-react 동일 개수: ~15KB (각 모듈 오버헤드 포함)
 *   → 약 3배 가벼움 + 첫 진입 후 추가 비용 0
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

/**
 * 사용 중인 아이콘 목록 — components/Icon/Icon.tsx 의 IconName 과 동기화 필수
 *
 * 키 = sprite 의 symbol id (kebab-case)
 * 값 = lucide-static 패키지 내 파일명 (보통 kebab-case 동일)
 */
const ICONS = [
  // BottomNav
  'home',
  'trending-up',
  'trophy',
  'mail',
  'user',
  // Header
  'bell',
  'settings',
  // Navigation
  'chevron-left',
  'chevron-right',
  // Feedback
  'check-circle',
  'x-circle',
  'info',
  'alert-triangle',
  'alert-circle',
  'x',
  // Status / connectivity
  'wifi-off',
  // Domain
  'sparkles',
  'map-pin',
  'heart',
  // Figma navIcon (여행한입 진짜최종3 / 3474:2183) — assets/icons/ 커스텀 소스
  'nav-home',
  'nav-home-active',
  'nav-rank',
  'nav-rank-active',
  'nav-trophy',
  'nav-trophy-active',
  'nav-letter',
  'nav-letter-active',
  'nav-my',
  'nav-my-active',
];

// 커스텀 SVG (Figma export) 우선 — 없으면 lucide-static fallback.
// 커스텀 소스는 stroke/fill 을 currentColor 로 정규화해서 커밋할 것.
const CUSTOM_DIR = resolve(ROOT, 'assets/icons');
const LUCIDE_DIR = resolve(ROOT, 'node_modules/lucide-static/icons');
const OUTPUT = resolve(ROOT, 'public/icons.svg');

function extractInner(svgString) {
  // <svg ...>...</svg> 에서 내부 자식만 추출 (path/circle/line 등)
  // 외부 svg 의 viewBox/속성은 sprite 의 symbol 로 이동
  const match = svgString.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
  if (!match) throw new Error('Invalid SVG');
  return { viewBox: match[1], inner: match[2].trim() };
}

function buildSprite() {
  const symbols = [];

  for (const name of ICONS) {
    let raw;
    try {
      raw = readFileSync(join(CUSTOM_DIR, `${name}.svg`), 'utf-8');
    } catch {
      try {
        raw = readFileSync(join(LUCIDE_DIR, `${name}.svg`), 'utf-8');
      } catch {
        console.error(
          `[icons] missing: ${name} (checked ${CUSTOM_DIR} and ${LUCIDE_DIR})`,
        );
        process.exit(1);
      }
    }
    const { viewBox, inner } = extractInner(raw);
    symbols.push(`  <symbol id="${name}" viewBox="${viewBox}">${inner}</symbol>`);
  }

  const sprite = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${symbols.join('\n')}
</svg>
`;

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, sprite, 'utf-8');
  const sizeKB = (sprite.length / 1024).toFixed(1);
  console.log(`[icons] generated ${OUTPUT} (${ICONS.length} icons, ${sizeKB} KB)`);
}

buildSprite();
