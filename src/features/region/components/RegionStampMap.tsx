'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
import { ChungbukStampMap } from './ChungbukStampMap';
import styles from './RegionStampMap.module.scss';

/**
 * 마이페이지 "충북 11개 시군 도장깨기" 위젯.
 *
 * 데이터: GET /mypage/stamps → { visited: RegionCode[], total: 11 }
 *
 * 시각화:
 *   - <ChungbukStampMap visited={...} onRegionClick={navigate} /> (정밀 11 시군 SVG)
 *   - 헤더: "찍은 도장 n / 11" (우측 정렬)
 *
 * isLoading → Skeleton / isError → EmptyState + retry / 정상 → 지도.
 */
export function RegionStampMap() {
  const t = useTranslations('mypage.stampMap');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useStamps();

  if (isLoading) {
    return <Skeleton width="100%" height={220} radius="lg" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<MapPin size={28} aria-hidden />}
        title={t('error')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  const visited = new Set(data.visited);

  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        <span className={styles.label}>{t('label')}</span>
        <span
          className={styles.count}
          aria-label={t('countAria', {
            visited: visited.size,
            total: data.total,
          })}
        >
          <strong>{visited.size}</strong>
          <span aria-hidden> / {data.total}</span>
        </span>
      </div>
      <ChungbukStampMap
        visited={visited}
        onRegionClick={(code) => router.push(`/region/${code}`)}
      />
    </div>
  );
}
