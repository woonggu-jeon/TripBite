'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { useToggleSaveLetter } from '@/features/letter/hooks/use-letters';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { haptic } from '@/lib/haptic';
import { relativeTimeToken } from '@/lib/relative-time';
import type { LetterDto } from '@/types/api-domain';
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

  // Figma `보낸 편지` 의 letterItem 은 작성자 자리에 닉네임이 아니라
  // "내가 작성한 편지" 를 쓴다 (내 편지 목록에서 내 닉네임이 반복되는 건 무의미).
  const authorLabel = letter.isMine
    ? t('author.mine')
    : letter.author.nickname || t('author.anonymous');

  // pill 은 시군만 — BE label 이 "충북 진천군"/"청주시" 로 섞여 와서 접두어를
  // 떼어 "진천군"/"청주시" 로 통일한다 (시안 `rp` 은 시군 한 덩어리).
  const regionLabel = letter.author.location
    ?.replace(/^충청북도\s*/, '')
    .replace(/^충북\s*/, '');

  return (
    <Link
      href={{ pathname: `/letter/${letter.id}` }}
      prefetch={false}
      className={`${styles.card} ${letter.isMine ? styles.cardMine : ''}`}
      aria-label={`${letter.body} ${authorLabel}`}
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
          {regionLabel && <span className={styles.region}>{regionLabel}</span>}
          <span className={styles.author}>{authorLabel}</span>
          <time className={styles.time} dateTime={iso}>
            · {time}
          </time>
        </span>
      </span>

      {/* 저장(북마크) 은 받은 편지 전용 — 내가 보낸 편지는 BE 가 막는다
          (POST /letters/{id}/save → 403 LETTER_ACCESS_DENIED). 실패만 하는
          버튼을 두지 않는다. 시안에는 세 탭 모두 아이콘이 있지만 사용자
          결정(2026-08-11)으로 보낸 편지에서는 제거. */}
      {!letter.isMine && (
        <button
          type="button"
          className={styles.save}
          onClick={onSave}
          aria-label={t('detail.save')}
          aria-pressed={savedLocal}
        >
          <Icon name={savedLocal ? 'bookmark-on' : 'bookmark'} size={20} />
        </button>
      )}
    </Link>
  );
}
