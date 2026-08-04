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
 *   1) scripts/build-icons.mjs 의 ICONS 배열에 추가
 *   2) npm run build:icons → public/icons.svg 자동 갱신
 *   3) 아래 IconName 에 등록
 */

export type IconName =
  // BottomNav
  | 'home'
  | 'trending-up'
  | 'flame'
  | 'trophy'
  | 'mail'
  | 'user'
  // Header
  | 'bell'
  | 'settings'
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

  return (
    <svg
      width={px}
      height={px}
      className={`${styles.icon} ${className ?? ''}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
