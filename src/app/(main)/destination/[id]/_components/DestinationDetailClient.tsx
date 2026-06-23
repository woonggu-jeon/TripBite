'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Compass } from 'lucide-react';
import { SubHeader } from '@/components/layout/SubHeader';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { useDestinationDetail } from '@/features/tournament/hooks/use-tournament';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { DestinationPhotos } from './DestinationPhotos';
import { DestinationActions } from './DestinationActions';
import { RelatedDestinations } from './RelatedDestinations';
import styles from './DestinationDetailClient.module.scss';

/**
 * 여행지 상세 client — `useDestinationDetail` 로 fetch 후 풍부한 메타 표시.
 *
 * Layout (위 → 아래):
 *   1) SubHeader        — 뒤로가기 + detail.name (fetch 후 채움)
 *   2) Hero             — 카테고리 이모지 + 시군 + 카테고리 라벨
 *   3) Name             — 큰 제목
 *   4) WinnerDetailPanel — summary/description + 주소/시간/휴무/주차/연락처/웹사이트
 *
 * isLoading / isError / 데이터 없음 모두 STYLES.md 표준 (Skeleton / EmptyState).
 */
export function DestinationDetailClient({ id }: { id: string }) {
  const t = useTranslations('destination');
  const tCategory = useTranslations('tournament.category');
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useDestinationDetail(id);

  // detail 없을 때도 안정적인 header 유지 (CLS 0).
  // 공유 버튼은 본문 DestinationActions 로 이동 — SubHeader rightSlot 제거.
  const title = detail?.name ?? '';

  if (isError) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <EmptyState
            icon={<AlertCircle size={28} aria-hidden />}
            title={t('errorTitle')}
            description={t('errorDescription')}
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  if (isLoading || !detail) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <Skeleton width="100%" height={234} radius="sm" />
          <div className={styles.infoSec}>
            <Skeleton width="70%" height={28} radius="md" />
            <Skeleton width="100%" height={180} radius="lg" />
          </div>
        </div>
      </>
    );
  }

  const regionName =
    CHUNGBUK_REGIONS.find((r) => r.code === detail.region)?.ko ?? detail.region;
  const categoryLabel = tCategory(
    detail.category as Parameters<typeof tCategory>[0],
  );

  return (
    <>
      <SubHeader title={title} />
      <article className={styles.wrap} aria-labelledby="destination-name">
        {/* Figma "POI · 장소상세 hero" — 360×234 carousel + dots. DestinationPhotos
            가 photos 있을 때 carousel + dots, 없으면 imageUrl 단일. */}
        <DestinationPhotos
          photos={detail.photos}
          imageUrl={detail.imageUrl}
          alt={detail.name}
        />

        {/* Figma info-sec — padding 20 20 24 gap 20 white bg. */}
        <section className={styles.infoSec}>
          {/* Figma title-area — row space-between: Frame 28 (name + region) +
              type-chip pill (compass + category). */}
          <div className={styles.titleArea}>
            <div className={styles.titleStack}>
              <h2 id="destination-name" className={styles.name}>
                {detail.name}
              </h2>
              <p className={styles.region}>{regionName}</p>
            </div>
            <span className={styles.typeChip}>
              <Compass size={13} aria-hidden />
              <span>{categoryLabel}</span>
            </span>
          </div>

          {/* info-card + overview — WinnerDetailPanel 위임. Figma info-card
              (5 field row + divider + overview) layout 은 panel 의 자체
              spec — 본 commit 에서 visual 완전 정합 보류 (panel 이 TournamentResult
              에서도 공유 — 변경 영향 큼). */}
          <WinnerDetailPanel detail={detail} isLoading={false} />
        </section>

        {/* Figma near-sec — padding 20 + DestinationCard 3 horizontal scroll.
            RelatedDestinations 가 이미 carousel. */}
        <section className={styles.nearSec}>
          <RelatedDestinations id={id} />
        </section>

        {/* Figma action-bar — padding 12 20 gap 10 row 2 button (outline +
            fill). DestinationActions 가 visual 정합. */}
        <DestinationActions
          id={id}
          name={detail.name}
          coords={detail.coords}
          shareText={detail.description}
        />
      </article>
    </>
  );
}
