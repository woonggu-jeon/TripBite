'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { TravelTypeDto } from '@/api/generated/schemas';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { TravelTypeIcon } from '@/components/ui';
import { DestinationCard } from '@/components/ui/DestinationCard';
import { categoryEmoji } from '@/constants/emoji-map';
import { toneFor } from '@/constants/region-tone';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import {
  useMyTravelType,
  useSetMyTravelType,
} from '@/features/ranking/hooks/use-ranking';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useShareCard } from '@/hooks/use-share-card';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import styles from './TravelTypeResult.module.scss';

/**
 * 여행 유형 결과 화면 — Figma "TST · 유형테스트 결과" (2026-06-23).
 *
 * 데이터 소스: useMyTravelType (GET /travel-types/me)
 *   - Quiz 직후 진입 시 submit 의 onSuccess 가 같은 queryKey 에 결과를 setQueryData.
 *   - 새로고침/딥링크 진입 시에도 me API 가 저장된 결과 반환.
 *
 * 구성:
 *   1) Banner — secondary01 bg + primary 1px border, emoji + code pill + title +
 *      keyword pills + description.
 *   2) Recommend — DestinationCard 3 horizontal scroll (saved-grid 408w).
 *   3) (TODO flow 3b) Match-section — compatibility.best / worst (BE 신규 필드).
 *   4) Actions — Frame 26: [retake outline + share primary] + [apply outline gray].
 *
 * UI 가 유형 코드를 분기하지 않음 — title/description/emoji/keywords/recommended 모두
 * 서버 응답 그대로 사용.
 */
export function TravelTypeResult() {
  const t = useTranslations('travelType.result');
  const router = useRouter();
  const { data, isLoading } = useMyTravelType();
  const applyMutation = useSetMyTravelType();
  const requireAuth = useRequireAuth();
  const shareCard = useShareCard();

  const handleApply = (result: TravelTypeDto) => {
    haptic.tap();
    void requireAuth(
      () =>
        applyMutation.mutate(result.code, {
          onSuccess: () => toast.success(t('appliedSuccess')),
          onError: () => toast.error(t('appliedFailed')),
        }),
      { reason: t('applyRequireAuth') },
    );
  };

  const handleShare = (result: TravelTypeDto) => {
    haptic.tap();
    const params = new URLSearchParams({
      type: result.code,
      name: result.title,
      emoji: result.emoji,
      ...(result.description ? { tagline: result.description } : {}),
      ...(result.keywords?.length
        ? { keywords: result.keywords.join(',') }
        : {}),
      ...(result.compatibility?.best
        ? {
            bestTitle: result.compatibility.best.title,
            bestEmoji: result.compatibility.best.emoji,
          }
        : {}),
    });
    return shareCard({
      imageUrl: `/api/og/quiz?${params.toString()}`,
      filename: `tripbite-traveltype-${result.code}.png`,
    });
  };

  if (isLoading) {
    return <div className={styles.fallback}>{t('loading')}</div>;
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
            size="md"
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
          >
            {t('startTest')}
          </Button>
        }
      />
    );
  }

  const result: TravelTypeDto = data;
  const keywords = result.keywords ?? [];
  const recommended = result.recommended ?? [];

  return (
    <div className={styles.wrap}>
      {/* Figma banner — 320×247 padding 28 22 24 gap 8 secondary01 + primary 1px. */}
      <div className={styles.banner}>
        <span className={styles.bannerEmoji} aria-hidden>
          <TravelTypeIcon code={result.code} size={52} priority />
        </span>
        <span className={styles.codePill}>{result.code}</span>
        <h2 className={styles.title}>{result.title}</h2>
        {keywords.length > 0 && (
          <ul className={styles.keywords} aria-label={t('keywordsAria')}>
            {keywords.map((k) => (
              <li key={k} className={styles.keywordPill}>
                {k}
              </li>
            ))}
          </ul>
        )}
        {result.description && (
          <p className={styles.description}>{result.description}</p>
        )}
      </div>

      {recommended.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('recommendTitle')}</h3>
          <ul className={styles.recommendList} aria-label={t('recommendTitle')}>
            {recommended.map((d) => {
              const region = CHUNGBUK_REGIONS.find((r) => r.code === d.region);
              const regionLabel = region?.ko ?? d.region;
              return (
                <li key={d.id} className={styles.recommendItem}>
                  <DestinationCard
                    href={{ pathname: `/destination/${d.id}` }}
                    imageUrl={d.imageUrl}
                    emoji={categoryEmoji(d.category)}
                    tone={toneFor(d.region as RegionCode)}
                    regionLabel={regionLabel}
                    name={d.name}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Figma "match-section" — BE compatibility.best/worst (2026-06-23 신규
          필드). 비로그인 submit 결과에도 포함 — 항상 노출 가능. */}
      {result.compatibility && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('compatibility.title')}</h3>
          <div className={styles.matchBox}>
            <div className={`${styles.matchRow} ${styles.matchRowBordered}`}>
              <span
                className={`${styles.matchEmoji} ${styles.matchEmojiBest}`}
                aria-hidden
              >
                {result.compatibility.best.emoji}
              </span>
              <div className={styles.matchText}>
                <span
                  className={`${styles.matchEyebrow} ${styles.matchEyebrowBest}`}
                >
                  {t('compatibility.bestLabel')}
                </span>
                <p className={styles.matchTitle}>
                  {result.compatibility.best.title}
                </p>
                <p className={styles.matchReason}>
                  {result.compatibility.best.reason}
                </p>
              </div>
            </div>
            <div className={styles.matchRow}>
              <span
                className={`${styles.matchEmoji} ${styles.matchEmojiWorst}`}
                aria-hidden
              >
                {result.compatibility.worst.emoji}
              </span>
              <div className={styles.matchText}>
                <span
                  className={`${styles.matchEyebrow} ${styles.matchEyebrowWorst}`}
                >
                  {t('compatibility.worstLabel')}
                </span>
                <p className={styles.matchTitle}>
                  {result.compatibility.worst.title}
                </p>
                <p className={styles.matchReason}>
                  {result.compatibility.worst.reason}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <div className={styles.actionsRow}>
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
            className={styles.btnRetake}
          >
            {t('retake')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleShare(result)}
          >
            {t('share')}
          </Button>
        </div>
        <Button
          variant="outline"
          fullWidth
          onClick={() => handleApply(result)}
          loading={applyMutation.isPending}
        >
          {t('apply')}
        </Button>
      </div>
    </div>
  );
}
