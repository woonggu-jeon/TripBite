import type { CSSProperties } from 'react';
import styles from './Icon.module.scss';

/**
 * <Icon /> — SVG Sprite 기반 단일 아이콘 컴포넌트
 *
 * 동작:
 *   <svg><use href="/icons.svg#home" /></svg>
 *   → 첫 진입 시 icons.svg 한 번 다운로드 (HTTP 캐시 + SW runtimeCaching 적용)
 *   → 이후 모든 아이콘 사용은 추가 네트워크 비용 0
 *
 * lucide-react 와의 비교:
 *   lucide-react: 아이콘 1개당 JS 모듈 1개 (tree-shake 후에도 누적)
 *   sprite:       SVG 한 파일 (~5KB) + JS 컴포넌트 1개
 *
 * 사용:
 *   <Icon name="home" size={20} />
 *   <Icon name="trophy" size="md" aria-label={t('nav.tournament')} />
 *
 * 새 아이콘 추가:
 *   1) scripts/build-icons.mjs 의 ICONS(lucide) 또는 FIGMA_ICONS 에 추가
 *   2) npm run build:icons → public/icons.svg 자동 갱신
 *   3) 아래 IconName 에 등록 (채움 아이콘이면 FILLED_ICONS 에도)
 */

export type IconName =
  // BottomNav
  | 'home'
  | 'trending-up'
  | 'flame'
  | 'trophy-detail'
  | 'compass'
  | 'trophy'
  | 'mail'
  | 'user'
  // Header — Figma `headerIcon` (back / setting / noti). setting·noti 는 채움.
  | 'back'
  | 'bell'
  | 'settings'
  // Figma `detailIcon` — 필드 행(18px) / 목록 pin(12px) / 하트·chevron(20px).
  // 이름에 크기를 붙인 이유: 같은 글리프라도 시안이 크기별로 stroke 와 디테일을
  // 다르게 그려서 (예: location 18 은 1.28, 12 는 0.85) 하나로 합칠 수 없다.
  | 'camera'
  | 'location-18'
  | 'location-12'
  | 'clock-18'
  | 'calendar-18'
  | 'parking-18'
  | 'internet-18'
  | 'share-18'
  | 'right-20'
  | 'heart-20'
  // Figma `bookmarkIcon` (편지 저장) / `circleIcon letter` (편지 빈 상태·배너)
  | 'bookmark'
  | 'bookmark-on'
  | 'letter-24'
  | 'letter-36'
  // Figma `circleIcon check` — 편지 발송완료
  | 'check-36'
  // Navigation
  | 'chevron-left'
  | 'chevron-right'
  // Feedback
  | 'check-circle'
  | 'x-circle'
  | 'info'
  | 'alert-triangle'
  | 'alert-circle'
  | 'x'
  // Status / connectivity
  | 'wifi-off'
  // Domain
  | 'sparkles'
  | 'map-pin'
  | 'heart';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;

const SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * 시안이 **채움**으로 그린 아이콘 — stroke 기반 기본값을 쓰면 안 된다.
 * (Figma headerIcon 의 setting·noti 가 채움 벡터다)
 */
const FILLED_ICONS = new Set<IconName>([
  'settings',
  'bell',
  'heart-20',
  'bookmark-on',
]);

/**
 * 시안이 지정한 아이콘별 stroke (viewBox 단위) — 렌더 크기와 무관하게 같은 굵기로
 * 보인다. 여기 있는 아이콘은 부모의 --icon-stroke 대신 이 값을 쓴다.
 */
const STROKE_WIDTHS: Partial<Record<IconName, number>> = {
  'location-18': 1.28,
  'location-12': 0.85,
  'clock-18': 1.275,
  'calendar-18': 1.275,
  'parking-18': 1.275,
  'internet-18': 1.275,
  'share-18': 1.28,
  'right-20': 1.5,
  camera: 1,
  bookmark: 1.558,
  'letter-24': 1.7,
  'letter-36': 2.7,
  'check-36': 4.6,
};

/**
 * 핵심: <svg> 안에 <use> 를 두어 외부 sprite 의 symbol 참조.
 *
 * Server Component 가능 — `'use client'` 없음 (단순 SVG render).
 */
export function Icon({
  name,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  name: IconName;
  size?: IconSize;
  className?: string;
  'aria-label'?: string;
}) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size];
  const stroke = STROKE_WIDTHS[name];

  return (
    <svg
      width={px}
      height={px}
      style={
        stroke === undefined
          ? undefined
          : ({ '--icon-stroke': stroke } as CSSProperties)
      }
      className={`${styles.icon} ${className ?? ''}`}
      data-filled={FILLED_ICONS.has(name) ? 'true' : undefined}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
