'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Icon } from '@/components/icon';
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
 * 구성 (Figma `MY · 충북 도장책` 실측):
 *   1) progCard — 큰 숫자 N / 11 + 남은 개수 라벨 + 진행률 바 + 안내 문구
 *   2) map-card — 정밀 지도 + 범례(도장 완료 / 미방문)
 *
 * 11/11 달성 시 progCard 테두리가 초록으로 바뀌고, 안내 문구 자리에
 * 마스터 카드 공유 행이 들어간다 (구 구현은 카드 밖 별도 버튼이었다).
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
        <Skeleton width="100%" height={120} radius="md" />
        <Skeleton width="100%" height={420} radius="md" />
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
      <section
        className={`${styles.progCard} ${isMaster ? styles.progCardMaster : ''}`}
      >
        <div className={styles.progTop}>
          <p className={styles.count}>
            <span className={styles.countNow}>{visitedCount}</span>
            <span className={styles.countTotal}>/ {data.total}</span>
          </p>
          <p className={styles.progLabel}>
            {isMaster
              ? t('masterAchieved')
              : t('remainingTitle', { remaining })}
          </p>
        </div>

        <div
          className={styles.track}
          role="progressbar"
          aria-valuenow={visitedCount}
          aria-valuemin={0}
          aria-valuemax={data.total}
          aria-label={t('progress', {
            visited: visitedCount,
            total: data.total,
          })}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>

        {isMaster ? (
          <button
            type="button"
            className={styles.masterLink}
            onClick={handleShareMaster}
          >
            {t('shareMaster')}
            <Icon name="right-20" size={20} />
          </button>
        ) : (
          <p className={styles.hint}>{t('masterHint')}</p>
        )}
      </section>

      <section className={styles.mapCard}>
        <ChungbukStampMap
          visited={visited}
          onRegionClick={(code) => router.push(`/region/${code}`)}
        />
        <ul className={styles.legend}>
          <li className={styles.legendItem}>
            <span
              className={`${styles.swatch} ${styles.swatchVisited}`}
              aria-hidden
            />
            {t('legendVisited')}
          </li>
          <li className={styles.legendItem}>
            <span className={styles.swatch} aria-hidden />
            {t('legendUnvisited')}
          </li>
        </ul>
      </section>
    </div>
  );
}
