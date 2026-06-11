'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
import styles from './StampBookBanner.module.scss';

/**
 * 마이페이지의 도장책 진입 배너 — "충북 마스터까지 N개 남음".
 *
 * 누르면 /mypage/stamps 의 전체 지도 페이지로 진입.
 * 마이페이지 메인은 가벼운 카운터/배너만 노출 — 무거운 SVG 지도는 별 페이지에서.
 *
 * 11/11 달성 시 라벨 "충북 마스터 달성!" 으로 분기 + sage 강조.
 */
export function StampBookBanner() {
  const t = useTranslations('mypage.stampBook');
  const { data, isLoading, isError } = useStamps();

  if (isLoading) {
    return <Skeleton width="100%" height={88} radius="lg" />;
  }

  if (isError || !data) {
    return (
      <Link href="/mypage/stamps" className={styles.banner}>
        <span className={styles.iconBox} aria-hidden>
          <MapPin size={20} />
        </span>
        <span className={styles.body}>
          <span className={styles.title}>{t('bannerErrorTitle')}</span>
          <span className={styles.progress}>{t('bannerErrorHint')}</span>
        </span>
        <ChevronRight size={20} aria-hidden className={styles.chevron} />
      </Link>
    );
  }

  const visited = data.visited.length;
  const total = data.total;
  const remaining = Math.max(0, total - visited);
  const isMaster = remaining === 0 && total > 0;

  return (
    <Link
      href="/mypage/stamps"
      className={`${styles.banner} ${isMaster ? styles.master : ''}`}
      aria-label={
        isMaster ? t('masterAchieved') : t('remainingTitle', { remaining })
      }
    >
      <span className={styles.iconBox} aria-hidden>
        <MapPin size={20} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>
          {isMaster ? t('masterAchieved') : t('remainingTitle', { remaining })}
        </span>
        <span className={styles.progress}>
          {t('progress', { visited, total })}
        </span>
      </span>
      <ChevronRight size={20} aria-hidden className={styles.chevron} />
    </Link>
  );
}
