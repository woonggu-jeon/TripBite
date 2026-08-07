'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useStamps } from '@/features/mypage/hooks/use-mypage';
import styles from './StampBookBanner.module.scss';

/**
 * 마이페이지의 도장책 진입 배너 — Figma `stamp-banner` (320x99).
 *
 *   흰 카드 (radius 12, 1px #E0E0E0), V gap 12, padding 20/16
 *   ├ 상단 행 : 제목 14 #151515  ─ 우측 "8/11" (찍은 수 초록 + /총 회색)
 *   └ 진행률 바 288x7  트랙 #F1F1F1 / 채움 #00B334, radius 999
 *
 * 이전엔 sage 팔레트 면 + 원형 아이콘 + chevron 이었다. 시안에는 아이콘과
 * chevron 이 없고(섹션 헤더의 "더보기" 가 그 역할), 진행률 바가 있다.
 *
 * 11/11 달성 시 제목만 "충북 마스터 달성!" 으로 분기.
 */
export function StampBookBanner() {
  const t = useTranslations('mypage.stampBook');
  const { data, isLoading, isError } = useStamps();

  if (isLoading) {
    // Figma 99px → 4px 그리드로 100
    return <Skeleton width="100%" height={100} radius="md" />;
  }

  if (isError || !data) {
    return (
      <Link href="/mypage/stamps" className={styles.banner}>
        <span className={styles.head}>
          <span className={styles.title}>{t('bannerErrorTitle')}</span>
          <span className={styles.count}>{t('bannerErrorHint')}</span>
        </span>
      </Link>
    );
  }

  const visited = data.visited.length;
  const total = data.total;
  const remaining = Math.max(0, total - visited);
  const isMaster = remaining === 0 && total > 0;
  const ratio = total > 0 ? Math.min(1, visited / total) : 0;

  return (
    <Link
      href="/mypage/stamps"
      className={styles.banner}
      aria-label={
        isMaster ? t('masterAchieved') : t('remainingTitle', { remaining })
      }
    >
      <span className={styles.head}>
        {/* Figma `f` — 제목 + 보조 한 줄, V gap 3 */}
        <span className={styles.headText}>
          <span className={styles.title}>
            {isMaster
              ? t('masterAchieved')
              : t('remainingTitle', { remaining })}
          </span>
          <span className={styles.hint}>{t('bannerHint', { total })}</span>
        </span>
        {/* Figma 는 "8" 만 초록, "/11" 은 회색 */}
        <span className={styles.count} aria-hidden>
          <span className={styles.countVisited}>{visited}</span>
          <span className={styles.countTotal}>/{total}</span>
        </span>
      </span>
      <span className={styles.track} aria-hidden>
        <span
          className={styles.fill}
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </span>
    </Link>
  );
}
