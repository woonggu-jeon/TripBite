'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { HeroCard, MediaThumb } from '@/components/ui';
import { categoryEmoji } from '@/constants/emoji-map';
import { isRegionCode } from '@/constants/regions';
import type { RankedDestination } from '@/features/ranking/types';
import styles from './Top5Card.module.scss';

/**
 * 여행지 랭킹 Top5 카드 — 클릭 시 /destination/{id} 로 이동.
 *
 * Figma `RNK · 랭킹` 은 1위와 2~5위를 다르게 그린다:
 *   - 1위    : `visualCard` = 사진 배경 hero (288x176, 텍스트 하단 좌측)
 *   - 2~5위  : `top5-row`  = 등수 + 원형 썸네일 + 이름/보조 한 줄
 *
 *   ┌──┬─────────────────────┬───────┐
 *   │2 │ 청남대                │ 우승  │
 *   │  │ 청주시                │ 28회  │
 *   └──┴─────────────────────┴───────┘
 *
 * Card primitive 의 polymorphic 미지원 (Link 와 결합 어려움) → cardClasses
 * 헬퍼 + raw Link. STYLES.md 의 권장 패턴.
 */
export function Top5Card({ item }: { item: RankedDestination }) {
  const t = useTranslations('ranking');
  const tRegion = useTranslations('region.names');
  const code = item.destination.region;
  const regionName = isRegionCode(code)
    ? tRegion(code as Parameters<typeof tRegion>[0])
    : code;

  // 1위 — Figma `visualCard`. 보조 줄은 시안의 "괴산군 · 28회" 구조를 그대로
  // 쓰되 문구는 기존 i18n(winsUnit) 조합으로만 만든다 (새 문구 도입 없음).
  if (item.rank === 1) {
    return (
      <HeroCard
        href={{ pathname: `/destination/${item.destination.id}` }}
        imageUrl={item.destination.imageUrl}
        emoji={categoryEmoji(item.destination.category, '🏆')}
        title={item.destination.name}
        meta={`${regionName} · ${item.score}${t('winsUnit')}`}
        titleAs="h3"
        align="bottom"
        sizes="(max-width: 720px) 100vw, 720px"
        ariaLabel={`${item.rank}위 ${item.destination.name}`}
      />
    );
  }

  return (
    <Link
      href={{ pathname: `/destination/${item.destination.id}` }}
      prefetch={false}
      className={styles.row}
      aria-label={`${item.rank}위 ${item.destination.name}`}
    >
      <span className={styles.rank} aria-hidden>
        {item.rank}
      </span>
      <MediaThumb
        src={item.destination.imageUrl}
        emoji={categoryEmoji(item.destination.category, '📍')}
        sizes="48px"
        className={styles.thumb}
        emojiClassName={styles.thumbEmoji}
      />
      <span className={styles.body}>
        <span className={styles.name}>{item.destination.name}</span>
        <span className={styles.meta}>
          {regionName} · {item.score}
          {t('winsUnit')}
        </span>
      </span>
    </Link>
  );
}
