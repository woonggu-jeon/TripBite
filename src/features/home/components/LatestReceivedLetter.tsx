'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';
import { useLettersInfinite } from '@/features/letter/hooks/use-letters';
import { relativeTimeToken } from '@/lib/relative-time';
import styles from './LatestReceivedLetter.module.scss';

/**
 * 홈 위젯 — 새로 도착한 편지(받은 편지 가장 최근 1개).
 *
 *   ┌────────────────────────────────┐
 *   │ 📬 새 편지 도착!                │
 *   │ ┌────┐ 5자 본문                 │
 *   │ │5자 │ 보낸이 · 3분 전        › │
 *   │ └────┘                         │
 *   └────────────────────────────────┘
 *
 * - useLettersInfinite('received') 의 첫 페이지 첫 항목 재사용
 *   (편지 메인 페이지가 이미 같은 queryKey 사용 → cache 공유, 추가 fetch 없음)
 * - 데이터 없으면 컴포넌트 자체 null 반환 (홈 첫 렌더 부담 X)
 */
export function LatestReceivedLetter() {
  const t = useTranslations('home.latestLetterWidget');
  const { data, isLoading } = useLettersInfinite('received');
  const latest = data?.pages[0]?.items[0];

  // 첫 fetch 중에는 컴포넌트 영역 자체 미노출 (렌더 속도 우선 — skeleton X)
  if (isLoading || !latest) return null;

  // received 편지라 arrivedAt 정상 있을 거지만 generated DTO 에서 string|null 라 fallback.
  const time = relativeTimeLabel(latest.arrivedAt ?? latest.createdAt, t);
  const author = latest.author.nickname;

  return (
    <Link
      href={{ pathname: `/letter/${latest.id}` }}
      prefetch={false}
      className={styles.card}
      aria-label={`${t('badge')} ${latest.body}`}
    >
      <span className={styles.badge}>
        <Mail size={14} aria-hidden />
        {t('badge')}
      </span>
      <div className={styles.row}>
        <div className={styles.pin} aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => {
            const ch = Array.from(latest.body)[i] ?? '';
            return (
              <span
                key={i}
                className={`${styles.cell} ${ch ? styles.filled : ''}`}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div className={styles.meta}>
          <p className={styles.author}>{author}</p>
          <p className={styles.time}>{time}</p>
        </div>
      </div>
    </Link>
  );
}

function relativeTimeLabel(
  iso: string,
  t: (
    key: 'justNow' | 'minutesAgo' | 'hoursAgo' | 'daysAgo',
    vars?: { n: number },
  ) => string,
): string {
  const tok = relativeTimeToken(iso);
  switch (tok.kind) {
    case 'justNow':
      return t('justNow');
    case 'minutes':
      return t('minutesAgo', { n: tok.value });
    case 'hours':
      return t('hoursAgo', { n: tok.value });
    case 'days':
      return t('daysAgo', { n: tok.value });
    case 'date': {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
  }
}
