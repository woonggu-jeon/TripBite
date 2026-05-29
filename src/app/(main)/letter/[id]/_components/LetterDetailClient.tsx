'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { LetterActions } from '@/features/letter/components/LetterActions';
import styles from './LetterDetailClient.module.scss';

/**
 * 받은 편지 상세 (/letter/[id])
 *
 *   ┌──────────────────────────────────────┐
 *   │ 📬  편지가 도착했어요                 │  상단 알림
 *   ├──────────────────────────────────────┤
 *   │ 편지지 (베이지 톤)                    │
 *   │  ─ FROM   닉네임 / 위치 / STAMP       │
 *   │  ─ Message  본문 / 도착 시각          │
 *   │  ─ TO   당신에게 도착했어요           │
 *   ├──────────────────────────────────────┤
 *   │ [♡ 좋아요] [🔖 저장] [🗑 삭제]         │
 *   ├──────────────────────────────────────┤
 *   │ ⓘ 저장하지 않으면 3일 후 자동 삭제     │  saved 면 숨김
 *   └──────────────────────────────────────┘
 */

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export function LetterDetailClient({ letterId }: { letterId: string }) {
  const router = useRouter();
  const t = useTranslations('letter.detail');
  const tAuthor = useTranslations('letter.author');
  const { data: letter, isLoading, isError, refetch } = useLetter(letterId);

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <Skeleton width="100%" height={64} radius="lg" />
        <Skeleton width="100%" height={320} radius="lg" />
        <Skeleton width="100%" height={68} radius="md" />
      </div>
    );
  }

  if (isError || !letter) {
    return (
      <div className={styles.empty}>
        <p>{t('loadError')}</p>
        <div className={styles.emptyActions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => refetch()}
          >
            {t('retry')}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => router.replace('/letter')}
          >
            {t('backToList')}
          </button>
        </div>
      </div>
    );
  }

  const senderName = letter.author.nickname || tAuthor('anonymous');
  const senderLocation = letter.author.location;

  return (
    <div className={styles.wrap}>
      {/* 1) 도착 알림 */}
      <header className={styles.notice} role="status">
        <span className={styles.noticeIcon} aria-hidden>
          <Inbox size={20} />
        </span>
        <div>
          <p className={styles.noticeTitle}>{t('arrivedTitle')}</p>
          <p className={styles.noticeBody}>{t('arrivedBody')}</p>
        </div>
      </header>

      {/* 2) 편지지 */}
      <article className={styles.letter} aria-label={t('letterAria')}>
        <section className={styles.from}>
          <p className={styles.label}>{t('from')}</p>
          <div className={styles.fromRow}>
            <div>
              <p className={styles.author}>{senderName}</p>
              {senderLocation && (
                <p className={styles.fromLocation}>{senderLocation}</p>
              )}
            </div>
            <div className={styles.stamp} aria-hidden>
              <Mail size={18} />
              <span className={styles.stampTag}>STAMP</span>
            </div>
          </div>
        </section>

        <section className={styles.message}>
          <p className={styles.body}>{letter.body}</p>
          <p className={styles.date}>{formatKoreanDate(letter.arrivedAt)}</p>
        </section>

        <section className={styles.to}>
          <p className={styles.label}>{t('to')}</p>
          <p className={styles.toLine}>{t('toYou')}</p>
        </section>
      </article>

      {/* 3) 액션 */}
      <LetterActions letter={letter} />

      {/* 4) 자동 삭제 안내 — saved 시 숨김 */}
      {!letter.saved && (
        <p className={styles.autoDelete} role="note">
          {t('autoDeleteNotice')}
        </p>
      )}
    </div>
  );
}
