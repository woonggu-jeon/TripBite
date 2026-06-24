'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { LetterActions } from '@/features/letter/components/LetterActions';
import styles from './LetterDetailClient.module.scss';

/**
 * 받은 편지 상세 (/letter/[id]) — Figma "받은 편지 상세" (2026-06-24) 정합.
 *
 * 구조 (Frame 77 column align center gap 40):
 *   - Frame 7 hero: circle 72 EAF6EF + Mail 36 primary stroke 2.69 + title
 *     B_24 fg "편지가 도착했어요" + sub R_14 muted "어디에서 왔을까요?…"
 *   - Frame 81 (gap 8 column align center):
 *     · Frame 79 stamp card (편지 발송완료 와 동일 spec — bg #F8F8F8 + border
 *       12 + padding 20 16):
 *       - top: pw (sq 60 우표 + 도착 도장 pm) + meta (from/닉네임/위치 right)
 *       - ms: 5 stamp cells (border-y error / cell border-right error) B_24 fg
 *       - div 1px gray
 *       - footer: B_10 disabled star + B_14 fg row + R_12 disabled note
 *     · sub R_12 fg center (자동 삭제 안내 등).
 *   - LetterActions absolute bottom 20.
 */

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
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
        <div className={styles.wb}>
          <div className={styles.skeletonHero}>
            <Skeleton width={72} height={72} radius="full" />
            <Skeleton width="60%" height={31} radius="sm" />
            <Skeleton width="80%" height={20} radius="sm" />
          </div>
          <Skeleton width="100%" height={292} radius="lg" />
        </div>
      </div>
    );
  }

  if (isError || !letter) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          variant="hero"
          icon={<Mail size={36} strokeWidth={2.7} aria-hidden />}
          title={t('loadError')}
          action={
            <div className={styles.errorActions}>
              <Button variant="secondary" size="md" onClick={() => refetch()}>
                {t('retry')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.replace('/letter')}
              >
                {t('backToList')}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const senderName = letter.author.nickname || tAuthor('anonymous');
  const senderLocation = letter.author.location;
  const arrivedAt = formatKoreanDate(letter.arrivedAt ?? letter.createdAt);

  return (
    <div className={styles.wrap}>
      <div className={styles.wb}>
        {/* Figma Frame 7 hero — circle 72 EAF6EF + Mail 36 primary + title +
            sub. */}
        <div className={styles.hero}>
          <span className={styles.circle} aria-hidden>
            <Mail size={36} strokeWidth={2.7} />
          </span>
          <div className={styles.headings}>
            <h1 className={styles.title}>{t('arrivedTitle')}</h1>
            <p className={styles.sub}>{t('arrivedBody')}</p>
          </div>
        </div>

        {/* Figma Frame 81 — card + sub note column gap 8. */}
        <div className={styles.cardBlock}>
          <article className={styles.card} aria-label={t('letterAria')}>
            <div className={styles.top}>
              <div className={styles.pw} aria-hidden>
                <span className={styles.sq}>
                  <span className={styles.sqChar}>
                    {Array.from(letter.body)[0] ?? ''}
                  </span>
                </span>
                <span className={styles.pm}>
                  <span className={styles.pmTitle}>{t('stampTitle')}</span>
                  <span className={styles.pmSub}>{t('stampSub')}</span>
                </span>
              </div>
              <div className={styles.meta}>
                <span className={styles.metaLabel}>{t('from')}</span>
                <span className={styles.metaName}>{senderName}</span>
                {senderLocation && (
                  <span className={styles.metaLoc}>{senderLocation}</span>
                )}
              </div>
            </div>

            {/* Figma ms > Frame 71 > Frame 70 — 이중 border + 12 gap 우표 천공
                효과 (사용자 명시 2026-06-24). */}
            <div className={styles.ms}>
              <div className={styles.cellsOuter}>
                <div className={styles.cells}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const ch = Array.from(letter.body)[i] ?? '';
                    return (
                      <div key={i} className={styles.cell}>
                        {ch && <span className={styles.cellChar}>{ch}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.div} aria-hidden />

            <div className={styles.footer}>
              <div className={styles.footerRow}>
                <span className={styles.footerStar} aria-hidden>
                  ✦
                </span>
                <span className={styles.footerLabel}>{t('toYou')}</span>
              </div>
              <span className={styles.footerNote}>{arrivedAt}</span>
            </div>
          </article>

          {/* Figma sub R_12 fg center — 자동 삭제 안내 (saved 시 미노출). */}
          {!letter.saved && (
            <p className={styles.note}>{t('autoDeleteNotice')}</p>
          )}
        </div>
      </div>

      {/* Figma buttons absolute bottom 20 — 저장/좋아요 + 답장 쓰기. */}
      <div className={styles.actions}>
        <LetterActions letter={letter} />
      </div>
    </div>
  );
}
