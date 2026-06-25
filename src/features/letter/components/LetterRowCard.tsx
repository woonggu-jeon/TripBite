'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icon/Icon';
import { useTranslations } from 'next-intl';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { haptic } from '@/lib/haptic';
import { relativeTimeToken } from '@/lib/relative-time';
import { useToggleSaveLetter } from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import styles from './LetterRowCard.module.scss';

/**
 * 편지 목록 row — Figma "편지 메인 · card" (2026-06-24 재정합).
 *
 * 구조:
 *   - 좌측 avatar 48×48 (sender 프로필 — BE author.avatarUrl 미제공 시 User
 *     icon fallback). 클릭 동작은 row 전체 Link 위임.
 *   - m (column gap 7):
 *     · title B_18 fg (5글자 본문)
 *     · r2 (row gap 8): pill 지역명 (Caption B_10 primary) + sub 닉네임 (Caption
 *       R_12 muted) + time (Caption R_12 disabled) + NEW badge (받은 편지 + unread).
 *   - 우측 bookmark icon button — saved 토글. row Link click 충돌 회피 위해
 *     preventDefault + stopPropagation.
 */

const TOGGLE_DEBOUNCE_MS = 400;

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

export function LetterRowCard({ letter }: { letter: LetterDto }) {
  const t = useTranslations('letter');
  const time = useRelativeTimeLabel(letter.arrivedAt ?? letter.createdAt);
  const isUnread = !letter.isMine && letter.read === false;
  const toggleSave = useToggleSaveLetter();

  const [savedLocal, setSavedLocal] = useState(letter.saved);
  useEffect(() => setSavedLocal(letter.saved), [letter.saved]);

  const commitSave = useDebouncedCallback((targetSaved: boolean) => {
    if (targetSaved === letter.saved) return;
    toggleSave.mutate(letter.id);
  }, TOGGLE_DEBOUNCE_MS);

  const onBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptic.tap();
    setSavedLocal((v) => {
      const next = !v;
      commitSave(next);
      return next;
    });
  };

  // 본인이 보낸 편지 (보낸 편지 탭) → /letter/sent?id 로 라우팅 (LetterSentClient
  // 재사용 — 보낸 편지 상세 view). 다른 사람이 보낸 편지 (받은/저장 탭) →
  // /letter/[id] (LetterDetailClient — 받은 편지 상세 view). 라우팅으로 view
  // 자연 분리 (사용자 명시 2026-06-25).
  const href = letter.isMine
    ? { pathname: '/letter/sent', query: { id: letter.id } }
    : { pathname: `/letter/${letter.id}` };

  return (
    <Link
      href={href}
      prefetch={false}
      className={styles.card}
      aria-label={`${letter.body} · ${letter.author.nickname}`}
    >
      {/* 좌측 avatar — BE author.avatarUrl 미제공 → User icon fallback.
          unread (받은 편지 + 미열람) 시 우상단 4×4 red dot notification badge
          (사용자 명시 2026-06-24 — pill 형태 NEW 아니라 dot). */}
      <span className={styles.avatarWrap} aria-hidden>
        <span className={styles.avatar}>
          <Icon name="user" size={24} />
        </span>
        {isUnread && <span className={styles.unread} />}
      </span>
      <div className={styles.m}>
        <h3 className={styles.title}>{letter.body}</h3>
        <div className={styles.r2}>
          {letter.author.location && (
            <span className={styles.pill}>{letter.author.location}</span>
          )}
          <span className={styles.sub}>
            {letter.author.nickname || t('author.anonymous')}
          </span>
          <span className={styles.time}>
            <time dateTime={letter.arrivedAt ?? letter.createdAt}>{time}</time>
          </span>
        </div>
      </div>
      {/* 우측 bookmark toggle — saved 시 fill. row click 충돌 회피. */}
      <button
        type="button"
        className={`${styles.bookmark} ${savedLocal ? styles.bookmarkActive : ''}`}
        onClick={onBookmark}
        aria-label={savedLocal ? t('detail.saved') : t('detail.save')}
        aria-pressed={savedLocal}
      >
        <Icon name={savedLocal ? 'bookmark-on' : 'bookmark-off'} size={22} />
      </button>
    </Link>
  );
}
