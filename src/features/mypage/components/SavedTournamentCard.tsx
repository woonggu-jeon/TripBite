'use client';

import { Icon } from '@/components/icon';
import { DestinationCard } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { categoryEmoji, FALLBACK_TROPHY_EMOJI } from '@/constants/emoji-map';
import type { SavedTournamentDto } from '@/api/generated/schemas';
import styles from './SavedTournamentCard.module.scss';

/**
 * 저장된 토너먼트 우승 여행지 카드 — `DestinationCard` primitive 재사용.
 *
 * 사용처:
 *   1) 마이페이지 메인 carousel — `onUnsave` 미전달, 단순 카드
 *   2) /mypage/saved-tournaments 상세 2열 그리드 — `onUnsave` 전달 → 우상단 하트
 *
 * 하트 클릭은 Link navigation 과 충돌하므로 e.preventDefault() + stopPropagation()
 * 으로 직접 차단. confirm 흐름과 mutation 은 호출부 (SavedTournamentsAll) 담당.
 */
export function SavedTournamentCard({
  saved,
  onUnsave,
  unsaveAriaLabel,
}: {
  saved: SavedTournamentDto;
  /** 우상단 하트 클릭 콜백 — 미전달 시 하트 미노출 (메인 carousel 등). */
  onUnsave?: () => void;
  /** 하트 a11y 라벨 — 호출부가 i18n 으로 전달. onUnsave 와 짝. */
  unsaveAriaLabel?: string;
}) {
  const region = CHUNGBUK_REGIONS.find(
    (r) => r.code === saved.destination.region,
  );
  const regionLabel = region?.ko ?? saved.destination.region;
  const emoji = categoryEmoji(
    saved.destination.category,
    FALLBACK_TROPHY_EMOJI,
  );

  const heart = onUnsave ? (
    <button
      type="button"
      className={styles.heart}
      aria-label={unsaveAriaLabel ?? 'Unsave'}
      onClick={(e) => {
        // Link navigation 차단 — 하트만 동작.
        e.preventDefault();
        e.stopPropagation();
        onUnsave();
      }}
    >
      {/* Figma `detailIcon` 20px heart — 채움 벡터 */}
      <Icon name="heart-20" size={16} className={styles.heartIcon} />
    </button>
  ) : undefined;

  return (
    <DestinationCard
      href={{ pathname: `/destination/${saved.destination.id}` }}
      imageUrl={saved.destination.imageUrl}
      emoji={emoji}
      regionLabel={regionLabel}
      name={saved.destination.name}
      // Figma 의 DestinationCard 에는 좌상단 색점이 없다 (마이페이지 carousel /
      // 저장한 우승지 목록 둘 다). luckyColor 점은 시안에 없어 표시하지 않는다.
      ariaLabel={`${saved.destination.name} · ${regionLabel}`}
      topRightAction={heart}
    />
  );
}
