'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin } from 'lucide-react';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { secureImageUrl } from '@/lib/secure-image-url';
import type { SavedTournamentDto } from '@/api/generated/schemas';
import styles from './SavedTournamentCard.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 카드 — Figma "MY · 저장한 우승지" DestinationCard
 * (2026-06-23) 정합. 152×168 white card border radius 12.
 *
 * 구조 (Figma):
 *   - Frame 2 (top): 152×108 image (background-cover)
 *   - Frame 4 (bottom): 152×60 padding 12/10 gap 4
 *     · title B_14 fg
 *     · meta row: MapPin 12 + region label Caption M_10 muted
 *   - heart-btn (옵션) 28×28 absolute right:10 top:10 white bg radius 14
 *     + Heart icon 16 danger filled
 *
 * 사용처:
 *   1) 마이페이지 메인 carousel — `onUnsave` 미전달, heart 미노출 (carousel 안
 *      unsave 시 카드 사라짐 UX 회피).
 *   2) /mypage/saved-tournaments 상세 2-col grid — `onUnsave` 전달 → heart 노출.
 *
 * 정직 보고 (DestinationCard primitive 와 시각 다름):
 *   - 우리 DestinationCard primitive 는 region-tone 색상 + emoji 패턴.
 *   - Figma "saved-grid" 의 DestinationCard 는 image-first + heart overlay.
 *   - 시각 명확히 다름 → SavedTournamentCard 자체 markup 으로 Figma 정합
 *     (DestinationCard primitive 미사용, 호환성 유지 위해 다른 사용처는 그대로).
 */
export function SavedTournamentCard({
  saved,
  onUnsave,
  unsaveAriaLabel,
}: {
  saved: SavedTournamentDto;
  /** 우상단 하트 클릭 콜백 — 미전달 시 하트 미노출. */
  onUnsave?: () => void;
  /** 하트 a11y 라벨 — 호출부가 i18n 으로 전달. */
  unsaveAriaLabel?: string;
}) {
  const region = CHUNGBUK_REGIONS.find(
    (r) => r.code === saved.destination.region,
  );
  const regionLabel = region?.ko ?? saved.destination.region;
  const imgSrc = secureImageUrl(saved.destination.imageUrl);

  return (
    <Link
      href={`/destination/${saved.destination.id}`}
      prefetch={false}
      className={styles.card}
      aria-label={`${saved.destination.name} · ${regionLabel}`}
    >
      <div className={styles.image}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt=""
            fill
            sizes="152px"
            className={styles.imageMedia}
          />
        ) : (
          // image 없을 때 빈 회색 박스 fallback — Figma 의 image-first
          // 패턴 유지 (region-tone 회귀 회피).
          <div className={styles.imageFallback} aria-hidden />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.title}>{saved.destination.name}</p>
        <div className={styles.meta}>
          <MapPin size={12} aria-hidden className={styles.metaIcon} />
          <span className={styles.metaLabel}>{regionLabel}</span>
        </div>
      </div>
      {onUnsave && (
        <button
          type="button"
          className={styles.heart}
          aria-label={unsaveAriaLabel ?? 'Unsave'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUnsave();
          }}
        >
          <Heart
            size={16}
            aria-hidden
            fill="currentColor"
            strokeWidth={1.5}
            className={styles.heartIcon}
          />
        </button>
      )}
    </Link>
  );
}
