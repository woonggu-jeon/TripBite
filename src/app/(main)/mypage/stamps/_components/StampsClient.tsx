'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
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

  // 실제 fetch 실패(isError)일 때만 에러 상태를 노출한다.
  // 쿼리가 아직 disabled(인증 하이드레이션 전) 이거나 로딩 중이면
  // React Query v5 에서 status='pending' + fetchStatus='idle' 이라 isLoading=false 지만
  // data 도 undefined 다. 이 경우를 "로드 실패"로 오표시하지 않고 skeleton 으로 처리
  // (직접 진입/하드 리프레시 시 /me 해석 전 false 에러 플래시 방지).
  if (isError) {
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

  if (isLoading || !data) {
    return (
      <div className={styles.wrap}>
        <Skeleton width="100%" height={68} radius="md" />
        <Skeleton width="100%" height={360} radius="lg" />
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

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.banner} ${isMaster ? styles.bannerMaster : ''}`}
      >
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>
            {isMaster
              ? t('masterAchieved')
              : t('remainingTitle', { remaining })}
          </p>
          <p className={styles.bannerProgress}>
            {t('progress', { visited: visitedCount, total: data.total })}
          </p>
        </div>
      </div>

      <ChungbukStampMap
        visited={visited}
        onRegionClick={(code) => router.push(`/region/${code}`)}
      />

      {isMaster && (
        <Button
          variant="primary"
          onClick={handleShareMaster}
          leadingIcon={<Share2 size={16} aria-hidden />}
        >
          {t('shareMaster')}
        </Button>
      )}
    </div>
  );
}
