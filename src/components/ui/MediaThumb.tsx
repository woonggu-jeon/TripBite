'use client';

import Image from 'next/image';
import { type ReactNode, useState } from 'react';
import { secureImageUrl } from '@/lib/secure-image-url';
import styles from './MediaThumb.module.scss';

export interface MediaThumbProps {
  /** 이미지 URL. http → https 자동 정규화. 없으면 emoji fallback. */
  src?: string | null;
  /** fallback emoji (또는 임의 노드). */
  emoji: ReactNode;
  /** next/image sizes — layout shift 회피. */
  sizes: string;
  /** container className — background/aspect/border-radius 호출 측 책임. */
  className?: string;
  /** emoji span className — font-size/filter 등 사용처별 override. */
  emojiClassName?: string;
  /** accent dot, top-right slot 등 추가 노드. */
  children?: ReactNode;
}

/**
 * 카드 썸네일 — `secureImageUrl + next/image fill | emoji span` 패턴 한 곳에서.
 *
 * 4 사용처 (DestinationCard / MatchupCard / WinnerCard /
 * RecommendationBanner.Slide) 가 동일 패턴 반복했던 것을 흡수.
 *
 * container 의 background/aspect-ratio/border-radius 등 시각 토큰은 호출 측
 * SCSS 가 책임 (사용처마다 56px fixed / 96px / aspect-square 등 다양).
 *
 * 안전망:
 *   - src 가 빈 string ("") 도 emoji fallback (null/undefined 와 동일 처리)
 *   - 이미지 load 실패 (next/image 400/404, TourAPI origin 404, encoding 오류
 *     등) 시 onError 트리거 → emoji fallback 으로 자동 전환
 */
export function MediaThumb({
  src,
  emoji,
  sizes,
  className,
  emojiClassName,
  children,
}: MediaThumbProps) {
  const [errored, setErrored] = useState(false);
  const safe = secureImageUrl(src && src.length > 0 ? src : undefined);
  const showImage = safe && !errored;
  return (
    <div className={className} aria-hidden>
      {showImage ? (
        <Image
          src={safe}
          alt=""
          fill
          sizes={sizes}
          // explicit quality (default 75 동일) — 의도 명시 (2026-06-19 audit).
          quality={75}
          className={styles.photo}
          onError={() => setErrored(true)}
        />
      ) : (
        <span className={emojiClassName ?? styles.emoji}>{emoji}</span>
      )}
      {children}
    </div>
  );
}
