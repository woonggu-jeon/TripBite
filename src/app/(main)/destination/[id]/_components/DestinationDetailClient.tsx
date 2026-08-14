'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Icon } from '@/components/icon';
import { SubHeader } from '@/components/layout/SubHeader';
import { Button } from '@/components/ui';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import {
  useDestinationDetail,
  useRelatedDestinations,
} from '@/features/tournament/hooks/use-tournament';
import { DestinationActions } from './DestinationActions';
import styles from './DestinationDetailClient.module.scss';
import { DestinationPhotos } from './DestinationPhotos';
import { RelatedDestinations } from './RelatedDestinations';

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
  // related 도 id 만 필요 — detail 로딩 게이트 뒤 마운트를 기다리지 않고 여기서 미리
  // 발사(RelatedDestinations 가 같은 queryKey 로 이 캐시 공유) → detail·related 병렬.
  // (이전엔 게이트 통과 후에야 related 가 시작돼 직렬 RTT 였다.)
  useRelatedDestinations(id);

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
          {/* 새 레이아웃과 같은 자리잡이 — 풀블리드 hero → 제목 → 정보 카드 */}
          <div className={styles.heroSkeleton} aria-hidden />
          <div className={styles.infoSec}>
            <Skeleton width="60%" height={26} radius="md" />
            <Skeleton width="100%" height={140} radius="md" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SubHeader title={title} />
      <article className={styles.wrap} aria-labelledby="destination-name">
        {/* 1) hero — Figma 360x234 풀블리드 사진 + 그라디언트. photos 있으면 캐러셀 */}
        <DestinationPhotos
          photos={detail.images}
          imageUrl={detail.imageUrl}
          alt={detail.name}
        />

        {/* 2) info-sec — Figma V gap 20 / padding 하단 24 */}
        <section className={styles.infoSec}>
          {/* title-area — 이름(20 Bold) + 카테고리 배지. 시안의 영문명은
              DTO 에 대응 필드가 없어 생략 (없는 데이터를 만들지 않는다). */}
          <div className={styles.titleArea}>
            <h2 id="destination-name" className={styles.name}>
              {detail.name}
            </h2>
            <span className={styles.badge}>
              <Icon name="compass" size={12} />
              {tCategory(detail.category as Parameters<typeof tCategory>[0])}
            </span>
          </div>

          {/* info-card — 주소/운영시간/휴무일/주차/전화/웹사이트 + 구분선 + 설명(더보기) */}
          <WinnerDetailPanel
            detail={detail}
            isLoading={false}
            variant="plain"
          />
        </section>

        {/* 3) 이 시군의 다른 여행지 */}
        <RelatedDestinations id={id} />

        {/* 4) action-bar — 길찾기(이름 검색) + 링크 공유(라인) */}
        <DestinationActions
          id={id}
          name={detail.name}
          shareText={detail.description}
        />
      </article>
    </>
  );
}
