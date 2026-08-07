'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { Icon } from '@/components/icon';
import { relativeTimeToken } from '@/lib/relative-time';
import { useToggleSaveLetter } from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import styles from './LetterRowCard.module.scss';

const TOGGLE_DEBOUNCE_MS = 400;

/**
 * 편지 목록의 row — Figma `letterItem` (320x82).
 *
 *   ┌──────┬───────────────────────────────────┬──────┐
 *   │stamp │ 다섯글자          ●(안읽음)        │ 북마크│
 *   │48 r8 │ [지역] 닉네임 · 방금               │  20  │
 *   └──────┴───────────────────────────────────┴──────┘
 *
 * 흰 카드(radius 12, 1px #E0E0E0), padding 16, H gap 12.
 *   stamp : 48x48 radius 8 연초록 + 24px profileIcon
 *   m     : V gap 7 — 본문 18 Bold + 안읽음 4px 빨간 점 / 메타 줄
 *   메타   : 지역 pill(연초록 999) + 닉네임 12 + "· 상대시각" 12 #B4B4B4
 *   우측   : bookmarkIcon 20 (off #B4B4B4 / on 초록 채움)
 *
 * 구 구현은 왼쪽에 hue 그라데이션 블록 + 본문을 넣고 우측에 하트 + 시간을
 * 세로로 쌓았다. 시안에는 그라데이션도, 하트도 없다 (저장=북마크).
 */
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
  // arrivedAt 이 null (아직 도착 전, sent 목록) 이면 createdAt 으로 fallback.
  const iso = letter.arrivedAt ?? letter.createdAt;
  const time = useRelativeTimeLabel(iso);
  const toggle = useToggleSaveLetter();

  // 즉각 UI 피드백 + 디바운스 commit. 짝수 번 클릭으로 원상복귀 시 호출 skip.
  const [savedLocal, setSavedLocal] = useState(letter.saved);
  useEffect(() => setSavedLocal(letter.saved), [letter.saved]);

  const commitSave = useDebouncedCallback((target: boolean) => {
    if (target === letter.saved) return;
    toggle.mutate(letter.id);
  }, TOGGLE_DEBOUNCE_MS);

  const onSave = (e: React.MouseEvent) => {
    e.preventDefault(); // Link 진입 차단
    e.stopPropagation();
    haptic.tap();
    setSavedLocal((v) => {
      const next = !v;
      commitSave(next);
      return next;
    });
  };

  const unread = !letter.isMine && letter.read === false;

  return (
    <Link
      href={{ pathname: `/letter/${letter.id}` }}
      prefetch={false}
      className={styles.card}
      aria-label={`${letter.body} ${letter.author.nickname || t('author.anonymous')}`}
    >
      {/* Figma `stamp` — 48x48 radius 8 연초록 + profileIcon 24 */}
      <span className={styles.stamp} aria-hidden>
        <Icon name="user" size={24} className={styles.stampIcon} />
      </span>

      <span className={styles.mid}>
        <span className={styles.titleRow}>
          <span className={styles.body}>{letter.body}</span>
          {unread && (
            <span className={styles.unread} aria-label={t('new')} role="img" />
          )}
        </span>
        <span className={styles.metaRow}>
          {letter.author.location && (
            <span className={styles.region}>{letter.author.location}</span>
          )}
          <span className={styles.author}>
            {letter.author.nickname || t('author.anonymous')}
          </span>
          <time className={styles.time} dateTime={iso}>
            · {time}
          </time>
        </span>
      </span>

      <button
        type="button"
        className={styles.save}
        onClick={onSave}
        aria-label={t('detail.save')}
        aria-pressed={savedLocal}
      >
        <Icon name={savedLocal ? 'bookmark-on' : 'bookmark'} size={20} />
      </button>
    </Link>
  );
}
