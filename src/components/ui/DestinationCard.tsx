import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { MediaThumb } from './MediaThumb';
import styles from './DestinationCard.module.scss';

export type DestinationCardTone = 'red' | 'amber' | 'green' | 'blue' | 'violet';

interface DestinationCardProps {
  /** 진입 경로. next/link 가 받는 형식 그대로 — typedRoutes 의 dynamic path 도 호환. */
  href: ComponentProps<typeof Link>['href'];
  /**
   * 실 이미지 URL (TourAPI). 있으면 next/image 로 표시.
   * 없으면 emoji + tone gradient fallback.
   * http URL 은 자동 https 정규화 (lib/secure-image-url).
   */
  imageUrl?: string | null;
  /** 카테고리 emoji (또는 임의 단일 글리프) — imageUrl 없을 때 fallback */
  emoji: string;
  /** 톤 키 — region 별 매핑. 색은 globals 의 --accent-{tone} 토큰 사용 */
  tone: DestinationCardTone;
  /** 시군 라벨 (eyebrow) */
  regionLabel: string;
  /** 메인 제목 */
  name: string;
  /** 카드 좌상단 액센트 dot 색 (예: luckyColor). 미지정 시 미노출 */
  accentDot?: string;
  /** 접근성 라벨 — 미지정 시 "name · region" 자동 */
  ariaLabel?: string;
  /**
   * 카드 우상단 액션 슬롯 — Link 영역 내부에 absolute 로 얹힘.
   * 자식 button 은 onClick 에서 e.preventDefault() + stopPropagation() 으로
   * Link navigation 을 직접 차단해야 함 (호출부 책임).
   */
  topRightAction?: ReactNode;
  /**
   * 카드 좌상단 뱃지 슬롯 — Link 영역 위 absolute. pointer-events:none 이라
   * 클릭은 Link 로 통과. D-day 뱃지 등 정적 표시만.
   */
  topLeftBadge?: ReactNode;
}

/**
 * Destination 형태 카드 — Figma `DestinationCard` (152x168).
 *
 *   이미지 152x108 (풀블리드)
 *   └ 본문 152x60 : 제목(14 Bold) → 핀 12 + 시군(10 Medium)
 *
 * 시안에 설명/캡션 줄이 없어 `description` / `caption` prop 을 제거했다.
 * 그 정보가 필요한 화면은 카드 밖(섹션 hint, D-day 뱃지 등)에서 표현한다.
 *
 * 사용처:
 *   - FestivalCarousel — topLeftBadge 로 D-day
 *   - RelatedDestinations — emoji + region/name
 *   - SavedTournamentsSection 의 tile — accentDot 으로 luckyColor 표시
 *
 * 톤은 시군 코드 → tone 매핑 (constants/region-tone.ts) 으로 결정. 톤별 accent 색은
 * 전역 --accent-{red|amber|green|blue|violet} 토큰. 디자이너가 한 곳에서 조정.
 */
export function DestinationCard({
  href,
  imageUrl,
  emoji,
  tone,
  regionLabel,
  name,
  accentDot,
  ariaLabel,
  topRightAction,
  topLeftBadge,
}: DestinationCardProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`${styles.card} ${styles[tone]}`}
      aria-label={ariaLabel ?? `${name} · ${regionLabel}`}
    >
      <MediaThumb
        src={imageUrl}
        emoji={emoji}
        sizes="(max-width: 480px) 50vw, 200px"
        className={styles.image}
        emojiClassName={styles.emoji}
      >
        {accentDot && (
          <span
            className={styles.accentDot}
            style={{ background: accentDot }}
          />
        )}
      </MediaThumb>
      {/* Figma `Frame 4` — 제목이 먼저, 그 아래 핀 + 시군 */}
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.region}>
          <MapPin size={12} className={styles.regionIcon} aria-hidden />
          <span className={styles.regionLabel}>{regionLabel}</span>
        </p>
      </div>
      {topRightAction && (
        <div className={styles.topRight}>{topRightAction}</div>
      )}
      {topLeftBadge && <div className={styles.topLeft}>{topLeftBadge}</div>}
    </Link>
  );
}
