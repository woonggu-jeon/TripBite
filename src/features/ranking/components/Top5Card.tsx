'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
  // Spring BE 의 weekly 집계는 destinationId/name/winCount 만 준다 (region 없음).
  // 그대로 template 에 넣으면 "undefined · 3회" 가 찍히므로 횟수만 남긴다.
  const wins = `${item.score}${t('winsUnit')}`;
  const metaText = regionName ? `${regionName} · ${wins}` : wins;

  // 1위 — Figma `visualCard`. 보조 줄은 시안의 "괴산군 · 28회" 구조를 그대로
  // 쓰되 문구는 기존 i18n(winsUnit) 조합으로만 만든다 (새 문구 도입 없음).
  if (item.rank === 1) {
    return (
      <HeroCard
        href={{ pathname: `/destination/${item.destination.id}` }}
        imageUrl={item.destination.imageUrl}
        emoji={categoryEmoji(item.destination.category, '🏆')}
        title={item.destination.name}
        meta={metaText}
        titleAs="h3"
        align="bottom"
        // Figma 랭킹 인스턴스는 rv-card(320, padding 16) 안이라 288x176 =
        // 18/11 이다. HeroCard 기본값은 홈 인스턴스의 320x176(20/11).
        className={styles.hero}
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
        <span className={styles.meta}>{metaText}</span>
      </span>
    </Link>
  );
}
