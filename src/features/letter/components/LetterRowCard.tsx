'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { cardClasses } from '@/components/ui';
import { relativeTimeToken } from '@/lib/relative-time';
import { useToggleLikeLetter } from '@/features/letter/hooks/use-letters';
import type { Letter } from '@/features/letter/types';
import styles from './LetterRowCard.module.scss';

const TOGGLE_DEBOUNCE_MS = 400;

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

  // 즉각 UI 피드백 + 디바운스 commit (LetterActions 와 동일 패턴).
  // 짝수 번 클릭으로 원상복귀 시 API 호출 skip.
  const [likedLocal, setLikedLocal] = useState(letter.liked);
  useEffect(() => setLikedLocal(letter.liked), [letter.liked]);

  const commitLike = useDebouncedCallback((target: boolean) => {
    if (target === letter.liked) return;
    toggle.mutate(letter.id);
  }, TOGGLE_DEBOUNCE_MS);

  const onLike = (e: React.MouseEvent) => {
    e.preventDefault(); // Link 진입 차단
    e.stopPropagation();
    haptic.tap();
    setLikedLocal((v) => {
      const next = !v;
      commitLike(next);
      return next;
    });
  };

  return (
    <Link
      href={{ pathname: `/letter/${letter.id}` }}
      prefetch={false}
      className={cardClasses({
        variant: 'surface',
        className: styles.card,
      })}
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
          className={`${styles.heart} ${likedLocal ? styles.liked : ''}`}
          onClick={onLike}
          aria-label={t('detail.like')}
          aria-pressed={likedLocal}
        >
          <Heart size={18} fill={likedLocal ? 'currentColor' : 'none'} />
        </button>
        <time className={styles.time} dateTime={letter.arrivedAt}>
          {time}
        </time>
      </div>
    </Link>
  );
}
