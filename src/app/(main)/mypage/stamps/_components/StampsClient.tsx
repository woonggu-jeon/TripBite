'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
import { MasterCard } from '@/features/mypage/components/MasterCard';
import { ChungbukStampMap } from '@/features/region/components/ChungbukStampMap';
import { useShareCard } from '@/hooks/use-share-card';
import { isRegionCode, type RegionCode } from '@/constants/regions';
import styles from './StampsClient.module.scss';

/**
 * 도장책 전체 페이지 client.
 *
 * 구성:
 *   1) 진행 배너 — "충북 마스터까지 N개 남음" 또는 "충북 마스터 달성!"
 *   2) 정밀 지도 — ChungbukStampMap (Sage Mist 색 / dashed 미획득)
 *   3) (11/11 도달 시) 마스터 OG 카드 공유 버튼
 */
export function StampsClient() {
  const t = useTranslations('mypage.stampBook');
  const router = useRouter();
  const shareCard = useShareCard();
  const { data, isLoading, isError, refetch } = useStamps();

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <Skeleton width="100%" height={68} radius="md" />
        <Skeleton width="100%" height={360} radius="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          icon={<MapPin size={28} aria-hidden />}
          title={t('error')}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('retry')}
            </Button>
          }
        />
      </div>
    );
  }

  // BE 응답의 visited 는 string[] (generated StampsDto). RegionCode 가드 후 Set.
  const visited = new Set(
    data.visited.filter((v): v is RegionCode => isRegionCode(v)),
  );
  const visitedCount = visited.size;
  const remaining = Math.max(0, data.total - visitedCount);
  const isMaster = remaining === 0 && data.total > 0;

  const handleShareMaster = () =>
    shareCard({
      imageUrl: `/api/og/master?count=${data.total}`,
      filename: 'tripbite-chungbuk-master.png',
    });

  const percent =
    data.total > 0 ? Math.round((visitedCount / data.total) * 100) : 0;

  return (
    <div className={styles.wrap}>
      {/* Figma prog-card — 328×120 white card padding 20 gap 12 + border radius 12.
          마스터 상태 시 border + label color primary. */}
      <div
        className={`${styles.progCard} ${isMaster ? styles.progCardMaster : ''}`}
      >
        <div className={styles.progTop}>
          <div className={styles.countWrap}>
            <span className={styles.countCurrent}>{visitedCount}</span>
            <span className={styles.countTotal}>/{data.total}</span>
          </div>
          <span className={styles.progLabel}>
            {isMaster ? t('masterAchieved') : t('bannerLabel')}
          </span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={data.total}
          aria-valuenow={visitedCount}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <p className={styles.progCaption}>
          {isMaster
            ? t('progCaptionMaster')
            : t('progCaption', { visited: visitedCount, remaining })}
        </p>
      </div>

      {/* Figma map-card — 328×461 white card padding 20 gap 12. */}
      <div className={styles.mapCard}>
        <ChungbukStampMap
          visited={visited}
          onRegionClick={(code) => router.push(`/region/${code}`)}
        />
        <div className={styles.legend} aria-hidden>
          <div className={styles.legendItem}>
            <span
              className={`${styles.legendSwatch} ${styles.legendSwatchVisited}`}
            />
            <span className={styles.legendLabel}>{t('legendVisited')}</span>
          </div>
          <div className={styles.legendItem}>
            <span
              className={`${styles.legendSwatch} ${styles.legendSwatchUnvisited}`}
            />
            <span className={styles.legendLabel}>{t('legendUnvisited')}</span>
          </div>
        </div>
      </div>

      {isMaster && (
        <>
          {/* Figma "MY · 마스터 카드" — 11/11 달성 축하 카드 본문에 노출. */}
          <MasterCard />
          <Button
            variant="primary"
            onClick={handleShareMaster}
            leadingIcon={<Share2 size={16} aria-hidden />}
          >
            {t('shareMaster')}
          </Button>
        </>
      )}
    </div>
  );
}
