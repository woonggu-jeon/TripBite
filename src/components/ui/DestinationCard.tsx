import Link from 'next/link';
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
  /**
   * 여행지명 하단 한 줄 설명 (RegionContentDto.description 매핑).
   * 한 줄 넘으면 ellipsis. 미지정 시 영역 자체 미노출 (카드 높이 그대로).
   */
  description?: string;
  /** 하단 보조 텍스트 (예: "10/14 — 10/16" 축제 기간) */
  caption?: string;
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
 * Destination 형태 카드 — 정사각 이미지(emoji) 위, 본문(region eyebrow + name + caption?) 아래.
 *
 * 사용처:
 *   - FestivalCarousel — caption 으로 축제 기간 전달
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
  description,
  caption,
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
      <div className={styles.body}>
        <p className={styles.region}>{regionLabel}</p>
        <h3 className={styles.name}>{name}</h3>
        {/*
          description 영역은 prop 유무와 무관하게 항상 렌더 — 카드 높이를
          그리드 안에서 일관 유지하기 위함. 값 없으면 nbsp 로 한 줄 자리만
          차지하고 시각상 비어 보임 (color: var(--color-muted) 라 nbsp 안 보임).
          aria-hidden 으로 스크린리더에 빈 paragraph 노출 차단.
        */}
        <p
          className={styles.description}
          aria-hidden={description ? undefined : true}
        >
          {description || ' '}
        </p>
        {caption && <p className={styles.caption}>{caption}</p>}
      </div>
      {topRightAction && (
        <div className={styles.topRight}>{topRightAction}</div>
      )}
      {topLeftBadge && <div className={styles.topLeft}>{topLeftBadge}</div>}
    </Link>
  );
}
