import Link from 'next/link';
import type { ComponentProps } from 'react';
import styles from './DestinationCard.module.scss';

export type DestinationCardTone = 'red' | 'amber' | 'green' | 'blue' | 'violet';

interface DestinationCardProps {
  /** 진입 경로. next/link 가 받는 형식 그대로 — typedRoutes 의 dynamic path 도 호환. */
  href: ComponentProps<typeof Link>['href'];
  /** 카테고리 emoji (또는 임의 단일 글리프) */
  emoji: string;
  /** 톤 키 — region 별 매핑. 색은 globals 의 --accent-{tone} 토큰 사용 */
  tone: DestinationCardTone;
  /** 시군 라벨 (eyebrow) */
  regionLabel: string;
  /** 메인 제목 */
  name: string;
  /** 하단 보조 텍스트 (예: "10/14 — 10/16" 축제 기간) */
  caption?: string;
  /** 카드 좌상단 액센트 dot 색 (예: luckyColor). 미지정 시 미노출 */
  accentDot?: string;
  /** 접근성 라벨 — 미지정 시 "name · region" 자동 */
  ariaLabel?: string;
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
  emoji,
  tone,
  regionLabel,
  name,
  caption,
  accentDot,
  ariaLabel,
}: DestinationCardProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`${styles.card} ${styles[tone]}`}
      aria-label={ariaLabel ?? `${name} · ${regionLabel}`}
    >
      <div className={styles.image} aria-hidden>
        {accentDot && (
          <span
            className={styles.accentDot}
            style={{ background: accentDot }}
          />
        )}
        <span className={styles.emoji}>{emoji}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.region}>{regionLabel}</p>
        <h3 className={styles.name}>{name}</h3>
        {caption && <p className={styles.caption}>{caption}</p>}
      </div>
    </Link>
  );
}
