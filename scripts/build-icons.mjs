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
  // Notification types
  'send',
  'shield-alert',
  // Status / connectivity
  'wifi-off',
  // Domain
  'sparkles',
  // BottomModal (Figma export — Lucide 와 path 비율 다름)
  'camera',
  'image',
  // DetailIcon (POI 상세 / badge — Figma detailIcon spec)
  'location',
  'compass',
  'clock',
  'calendar',
  'parking',
  'globe',
  'ticket',
  'award',
  'heart-fill',
  // CircleIcon (EmptyState hero 84-circle 안 큰 일러스트 — size 가변 36/46)
  'circle-check',
  'letter-large',
  'lock',
  'location-large',
  'noti',
  'heart-large',
  'trophy-large',
  // HeaderIcon (Header 우측 — Figma 디자인이 Lucide 와 다름)
  'settings-figma',
  'back',
  // UI state (on/off 별도 sprite — checkbox/bookmark/eye)
  'bookmark-on',
  'bookmark-off',
  'checkbox-on',
  'checkbox-off',
  'eye-on',
  'eye-off',
];

const LUCIDE_DIR = resolve(ROOT, 'node_modules/lucide-static/icons');
const OUTPUT = resolve(ROOT, 'public/icons.svg');

/**
 * BottomNav 5 탭 sprite key → Figma export SVG path. 같은 sprite key 의
 * lucide 기본 path 덮어쓰기 (Figma 디자인 정합). 색은 `currentColor` 로 일괄
 * 치환 — CSS color 로 active(primary) / off(disabled) 동적 변경.
 */
const LOCAL_OVERRIDES = {
  // Nav (BottomNav 5 탭). 색은 `currentColor` 일괄 치환 — CSS color 로 active
  // (primary) / off (disabled) 동적 변경.
  home: 'public/icon-sources/nav/home.svg',
  'trending-up': 'public/icon-sources/nav/rank.svg',
  trophy: 'public/icon-sources/nav/trophy.svg',
  mail: 'public/icon-sources/nav/letter.svg',
  user: 'public/icon-sources/nav/my.svg',
  // BottomModal (ProfileCard 카메라 / 갤러리). profile 은 nav user 와 동일 path
  // 라 별도 override 불필요 (`user` 키 재사용).
  camera: 'public/icon-sources/bottom-modal/camera.svg',
  image: 'public/icon-sources/bottom-modal/photo.svg',
  // DetailIcon — POI 상세 / badge (Figma detailIcon spec).
  // `location` (map-pin 과 비율 다름), `compass`, `clock`, `calendar`,
  // `parking`, `globe`, `ticket` = primary stroke icon.
  // `award` = detail trophy (BottomNav trophy 와 디자인 다름 → 별도 key).
  // `heart-fill` = fill 디자인 (Lucide stroke heart 와 별도 key).
  // primary/white/muted/danger 색은 currentColor 변환으로 CSS 에서 동적 적용.
  location: 'public/icon-sources/detail/location.svg',
  compass: 'public/icon-sources/detail/compass.svg',
  clock: 'public/icon-sources/detail/clock.svg',
  calendar: 'public/icon-sources/detail/calendar.svg',
  parking: 'public/icon-sources/detail/parking.svg',
  globe: 'public/icon-sources/detail/globe.svg',
  ticket: 'public/icon-sources/detail/ticket.svg',
  award: 'public/icon-sources/detail/trophy.svg',
  'heart-fill': 'public/icon-sources/detail/heart.svg',
  // CircleIcon (큰 일러스트 — EmptyState hero 사용. size 36/46 path 비율 동일).
  // `letter-large` (frame 16.67 vs nav letter 20.83 다름), `location-large`
  // (detail location 과 inside circle 위치 미세 다름), `heart-large` (detail
  // heart-fill 과 padding 다름), `trophy-large` (detail award 와 비율 다름).
  // `noti` = fill bell (Lucide stroke bell 과 별도 key).
  'circle-check': 'public/icon-sources/circle/check.svg',
  'letter-large': 'public/icon-sources/circle/letter.svg',
  lock: 'public/icon-sources/circle/lock.svg',
  'location-large': 'public/icon-sources/circle/location.svg',
  noti: 'public/icon-sources/circle/noti.svg',
  'heart-large': 'public/icon-sources/circle/heart.svg',
  'trophy-large': 'public/icon-sources/circle/trophy.svg',
  // HeaderIcon — `settings-figma` (Lucide settings 와 Vector 구성 다름),
  // `back` (Lucide chevron-left 는 ← path, Figma 는 rect 45도 rotated 디자인).
  'settings-figma': 'public/icon-sources/header/setting.svg',
  back: 'public/icon-sources/header/back.svg',
  // UI state — bookmark / checkbox / eye 의 on/off 별도 path (CSS variant 보다
  // sprite key 분리가 간단). color 는 currentColor 동적.
  'bookmark-on': 'public/icon-sources/ui/bookmark-on.svg',
  'bookmark-off': 'public/icon-sources/ui/bookmark-off.svg',
  'checkbox-on': 'public/icon-sources/ui/checkbox-on.svg',
  'checkbox-off': 'public/icon-sources/ui/checkbox-off.svg',
  'eye-on': 'public/icon-sources/ui/eye-on.svg',
  'eye-off': 'public/icon-sources/ui/eye-off.svg',
};

// SVG 안 hardcoded 색 (primary/muted/disabled/white/danger) → currentColor 치환.
// stroke 와 fill 양쪽 모두 적용 (heart 는 fill 디자인).
// `white` (named) 와 `#FFFFFF` 양쪽 매칭 — Figma export 패턴 호환.
const COLOR_PATTERN = /#B4B4B4|#00B334|#151515|#393939|#E1493C|#FFFFFF|\bwhite\b/gi;

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
    const override = LOCAL_OVERRIDES[name];
    const path = override
      ? resolve(ROOT, override)
      : join(LUCIDE_DIR, `${name}.svg`);
    let raw;
    try {
      raw = readFileSync(path, 'utf-8');
    } catch {
      console.error(`[icons] missing: ${name} (expected at ${path})`);
      process.exit(1);
    }
    const { viewBox, inner } = extractInner(raw);
    // Local override 의 hardcoded 색을 currentColor 로 치환 (CSS 동적 색 가능).
    const normalized = override ? inner.replace(COLOR_PATTERN, 'currentColor') : inner;
    symbols.push(`  <symbol id="${name}" viewBox="${viewBox}">${normalized}</symbol>`);
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
