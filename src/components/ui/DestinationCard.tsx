import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { MediaThumb } from './MediaThumb';
import styles from './DestinationCard.module.scss';

interface DestinationCardProps {
  /** 진입 경로. next/link 가 받는 형식 그대로 — typedRoutes 의 dynamic path 도 호환. */
  href: ComponentProps<typeof Link>['href'];
  /**
   * 실 이미지 URL (TourAPI). 있으면 next/image 로 표시.
   * 없으면 emoji + 연초록 그라데이션 fallback.
   * http URL 은 자동 https 정규화 (lib/secure-image-url).
   */
  imageUrl?: string | null;
  /** 카테고리 emoji (또는 임의 단일 글리프) — imageUrl 없을 때 fallback */
  emoji: string;
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
 * hover 강조는 브랜드 초록 하나다 (2026-08-05 결정). 이전에는 시군 코드를 5색에
 * 나눠 담아 카드마다 hover 색이 달랐는데, 색과 시군 사이에 의미 연결이 없었고
 * 시안(Figma)에도 시군별 색 개념이 없다 — 카드는 흰 면 + #E0E0E0 보더 하나뿐.
 */
export function DestinationCard({
  href,
  imageUrl,
  emoji,
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
      className={styles.card}
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
