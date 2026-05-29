'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { relativeTimeToken } from '@/lib/relative-time';
import { useToggleLikeLetter } from '@/features/letter/hooks/use-letters';
import type { Letter } from '@/features/letter/types';
import styles from './LetterRowCard.module.scss';

/**
 * 편지 목록의 row 카드.
 *
 *   ┌──────┬───────────────────────────────┬──────────┐
 *   │ 본문 │ 작가 · 위치                    │  ♥       │
 *   │ 5자  │                                │  3분 전  │
 *   └──────┴───────────────────────────────┴──────────┘
 *
 *   - 왼쪽: 그라데이션 배경 + 5자 본문 (다섯글자 편지의 정체성)
 *   - 가운데: 작가 닉네임 · 보낸 위치
 *   - 오른쪽: 좋아요 토글 + 상대 시간
 */

function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function useRelativeTimeLabel(iso: string): string {
  const t = useTranslations('letter.relativeTime');
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

export function LetterRowCard({ letter }: { letter: Letter }) {
  const t = useTranslations('letter');
  const time = useRelativeTimeLabel(letter.arrivedAt);
  const toggle = useToggleLikeLetter();
  const hue = hueFromId(letter.id);

  const onLike = (e: React.MouseEvent) => {
    e.preventDefault(); // Link 진입 차단
    e.stopPropagation();
    if (toggle.isPending) return;
    haptic.tap();
    toggle.mutate(letter.id);
  };

  return (
    <Link
      href={{ pathname: `/letter/${letter.id}` }}
      className={styles.card}
      aria-label={`${letter.body} ${letter.author.nickname}`}
    >
      <div
        className={styles.image}
        style={{
          background: `linear-gradient(135deg, hsl(${hue}deg 70% 70%), hsl(${(hue + 30) % 360}deg 70% 80%))`,
        }}
        aria-hidden
      >
        <span className={styles.body}>{letter.body}</span>
      </div>

      <div className={styles.meta}>
        <p className={styles.author}>
          {letter.author.nickname || t('author.anonymous')}
        </p>
        {letter.author.location && (
          <p className={styles.location}>{letter.author.location}</p>
        )}
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={`${styles.heart} ${letter.liked ? styles.liked : ''}`}
          onClick={onLike}
          aria-label={t('detail.like')}
          aria-pressed={letter.liked}
        >
          <Heart size={18} fill={letter.liked ? 'currentColor' : 'none'} />
        </button>
        <time className={styles.time} dateTime={letter.arrivedAt}>
          {time}
        </time>
      </div>
    </Link>
  );
}
