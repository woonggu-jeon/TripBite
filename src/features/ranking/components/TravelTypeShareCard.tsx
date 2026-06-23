'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button } from '@/components/ui';
import { useMyTravelType } from '@/features/ranking/hooks/use-ranking';
import styles from './TravelTypeShareCard.module.scss';

/**
 * 여행 유형 공유 카드 — Figma "TST · 공유 이미지 카드" (2026-06-23).
 *
 * 데이터: useMyTravelType (서버 응답 그대로). 결과 없음 시 /quiz 로 redirect.
 *
 * 공유:
 *   - Web Share API (navigator.share) 우선 사용
 *   - 미지원/실패 시 클립보드 복사 fallback
 *   - 이미지 추출(html2canvas 등)은 추후 — 현재는 텍스트 + URL share
 *
 * 시각:
 *   360×360 정사각 카드 — gradient peach/cream + #C6C6C6 1px border + radius 20.
 *   내부: emoji 52 → code pill primary → B_24 title → keyword pills secondary01 →
 *   R_14 description → 💚 match-line (compatibility.best 있을 때) → brand footer.
 */
export function TravelTypeShareCard() {
  const t = useTranslations('travelType.share');
  const tResult = useTranslations('travelType.result');
  const router = useRouter();
  const { data, isLoading } = useMyTravelType();

  if (isLoading) {
    return (
      <div className={styles.fallback} role="status" aria-label={t('loading')}>
        <Skeleton width="100%" height={220} radius="lg" />
        <Skeleton width="60%" height={20} radius="sm" />
        <Skeleton width="100%" height={48} radius="md" />
      </div>
    );
  }
  if (!data) {
    return (
      <EmptyState
        icon={
          <span aria-hidden style={{ fontSize: 28 }}>
            🧭
          </span>
        }
        title={t('empty')}
        description={t('emptyHint')}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.replace('/quiz')}
          >
            {t('startTest')}
          </Button>
        }
      />
    );
  }

  const keywords = data.keywords ?? [];
  const shareText =
    keywords.length > 0
      ? `${data.emoji} ${data.title} — ${keywords.join(' ')}`
      : `${data.emoji} ${data.title}`;

  const handleShare = async () => {
    haptic.tap();
    const shareData = {
      title: data.title,
      text: shareText,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // 사용자 취소 / 권한 거부 — fallback 으로
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${shareText}\n${shareData.url ?? ''}`,
        );
      } catch {
        // 무시
      }
    }
  };

  return (
    <div className={styles.wrap}>
      {/* Figma 360×360 정사각 카드 — gradient peach/cream + 1px stroke + radius 20. */}
      <article className={styles.card} aria-label={data.title}>
        <span className={styles.cardEmoji} aria-hidden>
          {data.emoji}
        </span>
        <span className={styles.cardCode}>{data.code}</span>
        <h3 className={styles.cardTitle}>{data.title}</h3>
        {keywords.length > 0 && (
          <ul className={styles.cardKeywords}>
            {keywords.map((k) => (
              <li key={k} className={styles.cardKeywordPill}>
                {k}
              </li>
            ))}
          </ul>
        )}
        {data.description && (
          <p className={styles.cardDescription}>{data.description}</p>
        )}
        {data.compatibility?.best && (
          <span className={styles.cardMatchLine}>
            <span aria-hidden>💚</span>
            <span>
              {tResult('compatibility.bestLabel')} ·{' '}
              {data.compatibility.best.title}
            </span>
          </span>
        )}
        <span className={styles.cardFooter}>
          <span aria-hidden className={styles.cardFooterIcon}>
            🥢
          </span>
          <span className={styles.cardFooterText}>여행 한입</span>
        </span>
      </article>

      <Button variant="primary" fullWidth onClick={handleShare}>
        {t('shareCta')}
      </Button>
      <p className={styles.shareHint}>{t('shareHint')}</p>
    </div>
  );
}
