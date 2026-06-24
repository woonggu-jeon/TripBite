'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { relativeTimeToken } from '@/lib/relative-time';
import type { LetterDto } from '@/api/generated/schemas';
import styles from './LetterRowCard.module.scss';

/**
 * 편지 목록 row — Figma "편지 메인 · card" (2026-06-24) 정합.
 *
 * spec:
 *   - 320×82 padding 16 gap 12 white + 1px gray border + radius 12 row.
 *   - stamp 48×48 #EAF6EF (primary-soft) radius 8 center — 본문 첫 글자
 *     Inter ExtraBold 19 primary.
 *   - m (column gap 7 width 194):
 *     · title B_18 fg (5글자 본문)
 *     · r2 (row gap 8): rp pill 36×18 #EAF6EF padding 3 9 + Caption B_10
 *       primary (작가 location 가 있으면 "위치", 없으면 "익명") + Caption R_12
 *       muted (location / nickname) + Caption R_12 disabled (상대 시간)
 *   - chev 22 disabled (read) / primary (unread).
 *   - notification red dot 4×4 #E1493C absolute (unread + 받은 편지).
 *
 * 좋아요 / 저장 토글은 detail 페이지에서 처리 — list row 는 노출 X (사용자 명시
 * Figma spec 정합).
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
  const time = useRelativeTimeLabel(letter.arrivedAt ?? letter.createdAt);
  // 본문 첫 글자 (5글자 편지 — 첫 글자만 stamp 노출).
  const firstChar = Array.from(letter.body)[0] ?? '';
  const isUnread = !letter.isMine && letter.read === false;
  // pill label — 위치가 있으면 "위치", 없으면 "익명" (받은/보낸 무관 동일 패턴).
  const pillLabel = letter.author.location
    ? t('row.pillLocation')
    : t('row.pillAnonymous');
  const subText =
    letter.author.location ?? letter.author.nickname ?? t('author.anonymous');

  return (
    <Link
      href={{ pathname: `/letter/${letter.id}` }}
      prefetch={false}
      className={styles.card}
      aria-label={`${letter.body} · ${subText}`}
    >
      <span className={styles.stamp} aria-hidden>
        {firstChar}
      </span>
      <div className={styles.m}>
        <h3 className={styles.title}>{letter.body}</h3>
        <div className={styles.r2}>
          <span className={styles.pill}>{pillLabel}</span>
          <span className={styles.sub}>{subText}</span>
          <span className={styles.time}>
            <time dateTime={letter.arrivedAt ?? letter.createdAt}>{time}</time>
          </span>
          {isUnread && <span className={styles.unread} aria-hidden />}
        </div>
      </div>
      <ChevronRight
        size={22}
        className={isUnread ? styles.chevUnread : styles.chev}
        aria-hidden
      />
    </Link>
  );
}
