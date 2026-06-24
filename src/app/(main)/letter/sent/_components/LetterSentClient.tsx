'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { useLetterStore } from '@/features/letter/store/letter-store';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import styles from './LetterSentClient.module.scss';

/**
 * /letter/sent — 보낸 편지 결과 — Figma "편지 발송완료" (2026-06-24) 정합.
 *
 * 구조 (Frame 77 column gap 40):
 *   - Frame 7 hero: circle 72 EAF6EF + Send 36 primary stroke 4.6 + title
 *     B_24 fg "편지를 보냈어요" + sub R_14 muted "랜덤한 시간에 누군가에게
 *     도착해요".
 *   - Frame 79 sent card (bg #F8F8F8 + 1px gray border + radius 12 padding
 *     20 16):
 *     · top: pw (sq 60 우표) + meta (column right: B_10 disabled + B_16 fg
 *       + R_12 muted).
 *     · ms: 5 stamp cells (border-y error / border-right error) B_24 fg.
 *     · div 1px gray.
 *     · Frame 80: fr (B_10 disabled + B_14 fg row) + R_12 disabled right.
 *   - button absolute bottom 20: 320×52 outline primary "또 편지 쓰기".
 *
 * BE 연동 시 점진 — 현재 letter-store lastSent + ?id= deep-link fallback.
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

export function LetterSentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const letterId = searchParams.get('id');
  const t = useTranslations('letter.sent');
  const tAuthor = useTranslations('letter.author');
  const lastSent = useLetterStore((s) => s.lastSent);

  const letterQuery = useLetter(letterId ?? '');
  const enabled = !!letterId;
  const serverLetter = enabled ? letterQuery.data : undefined;

  const view: { body: string; sentAt: string; location: string } | null =
    serverLetter
      ? {
          body: serverLetter.body,
          sentAt: serverLetter.createdAt,
          location: serverLetter.author.location ?? tAuthor('anonymous'),
        }
      : lastSent
        ? {
            body: lastSent.body,
            sentAt: lastSent.sentAt,
            location: lastSent.location?.label ?? tAuthor('anonymous'),
          }
        : null;

  if (enabled && letterQuery.isLoading && !lastSent) {
    return (
      <div className={styles.wrap}>
        <div className={styles.skeletonHero}>
          <Skeleton width={72} height={72} radius="full" />
          <Skeleton width="60%" height={31} radius="sm" />
          <Skeleton width="80%" height={20} radius="sm" />
        </div>
        <Skeleton width="100%" height={292} radius="lg" />
      </div>
    );
  }

  if (enabled && letterQuery.isError && !lastSent) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          variant="hero"
          icon={<Send size={36} strokeWidth={2.7} aria-hidden />}
          title={t('loadError')}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => letterQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!view) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          variant="hero"
          icon={<Send size={36} strokeWidth={2.7} aria-hidden />}
          title={t('empty')}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => router.replace('/letter/compose')}
            >
              {t('goCompose')}
            </Button>
          }
        />
      </div>
    );
  }

  const handleAgain = () => router.replace('/letter/compose');
  const date = formatKoreanDate(view.sentAt);

  return (
    <div className={styles.wrap}>
      <div className={styles.wb}>
        {/* Figma Frame 7 hero — circle 72 EAF6EF + Send 36 primary + title +
            sub. */}
        <div className={styles.hero}>
          <span className={styles.circle} aria-hidden>
            <Send size={36} strokeWidth={2.7} />
          </span>
          <div className={styles.headings}>
            <h1 className={styles.title}>{t('noticeTitle')}</h1>
            <p className={styles.sub}>{t('noticeBody')}</p>
          </div>
        </div>

        {/* Figma Frame 79 — sent letter card. */}
        <article className={styles.card} aria-label={t('letterAria')}>
          <div className={styles.top}>
            <div className={styles.pw} aria-hidden>
              <span className={styles.sq}>
                <span className={styles.sqChar}>
                  {Array.from(view.body)[0] ?? ''}
                </span>
              </span>
              <span className={styles.pm}>
                <span className={styles.pmTitle}>{t('stampTitle')}</span>
                <span className={styles.pmSub}>{t('stampSub')}</span>
              </span>
            </div>
            <div className={styles.meta}>
              <span className={styles.metaLabel}>{t('from')}</span>
              <span className={styles.metaName}>{tAuthor('anonymous')}</span>
              <span className={styles.metaLoc}>{view.location}</span>
            </div>
          </div>

          {/* Figma ms — 5 stamp cells (border-y error). */}
          <div className={styles.ms}>
            <div className={styles.cells}>
              {Array.from({ length: 5 }).map((_, i) => {
                const ch = Array.from(view.body)[i] ?? '';
                return (
                  <div key={i} className={styles.cell}>
                    {ch && <span className={styles.cellChar}>{ch}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.div} aria-hidden />

          {/* Figma Frame 80 — gap 4 column. fr (B_10 + B_14) + R_12 disabled. */}
          <div className={styles.footer}>
            <div className={styles.footerRow}>
              <span className={styles.footerStar} aria-hidden>
                ✦
              </span>
              <span className={styles.footerLabel}>{t('toRecipient')}</span>
            </div>
            <span className={styles.footerNote}>{date}</span>
          </div>
        </article>
      </div>

      {/* Figma button absolute bottom 20 — outline primary M_16. */}
      <div className={styles.actions}>
        <Button variant="outline" fullWidth onClick={handleAgain}>
          {t('again')}
        </Button>
      </div>
    </div>
  );
}
