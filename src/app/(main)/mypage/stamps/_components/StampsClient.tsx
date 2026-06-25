'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon/Icon';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
import { ChungbukStampMap } from '@/features/region/components/ChungbukStampMap';
import { useShareCard } from '@/hooks/use-share-card';
import { haptic } from '@/lib/haptic';
import { isRegionCode, type RegionCode } from '@/constants/regions';
import styles from './StampsClient.module.scss';

/**
 * 도장책 전체 페이지 client.
 *
 * 구성:
 *   1) prog-card — 진행도 + 라벨. 11/11 달성 시 자체 button (click = share OG
 *      master PNG). 사용자 명시 (2026-06-23): 별도 축하 카드 본문 노출 X,
 *      "11개 시군 모두 모으면 충북 마스터 카드를 받아요" 영역 (= prog-card)
 *      만 share trigger.
 *   2) 정밀 지도 — ChungbukStampMap (Sage Mist 색 / dashed 미획득).
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
          icon={<Icon name="location-large" size={28} />}
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

  const progCardLabel = isMaster
    ? t('masterAchieved')
    : t('bannerLabel', { remaining });
  const progCardCaption = isMaster
    ? t('progCaptionMaster')
    : t('progCaption', {
        total: data.total,
        visited: visitedCount,
        remaining,
      });

  // master 시 prog-card 자체가 share trigger (Figma "탭하여 마스터 카드
  // 공유하기" — caption click → useShareCard. 토너먼트 결과 공유 동일 패턴).
  const handleProgCardClick = () => {
    if (!isMaster) return;
    haptic.tap();
    void handleShareMaster();
  };

  const progCardContent = (
    <>
      <div className={styles.progTop}>
        <div className={styles.countWrap}>
          <span className={styles.countCurrent}>{visitedCount}</span>
          <span className={styles.countTotal}>/{data.total}</span>
        </div>
        <span className={styles.progLabel}>{progCardLabel}</span>
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
      <p className={styles.progCaption}>{progCardCaption}</p>
    </>
  );

  return (
    <div className={styles.wrap}>
      {/* Figma prog-card — 328×120 white card padding 20 gap 12 + border radius 12.
          마스터 상태 시 border + label color primary + 카드 자체 button (share). */}
      {isMaster ? (
        <button
          type="button"
          className={`${styles.progCard} ${styles.progCardMaster} ${styles.progCardButton}`}
          onClick={handleProgCardClick}
          aria-label={t('shareMasterAria')}
        >
          {progCardContent}
        </button>
      ) : (
        <div className={styles.progCard}>{progCardContent}</div>
      )}

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
    </div>
  );
}
