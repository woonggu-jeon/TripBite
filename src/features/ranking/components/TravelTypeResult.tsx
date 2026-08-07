'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Share2, RotateCcw, BadgeCheck } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button, ButtonGrid, Card, Chip } from '@/components/ui';
import {
  useMyTravelType,
  useSetMyTravelType,
} from '@/features/ranking/hooks/use-ranking';
import type { TravelTypeDto } from '@/api/generated/schemas';
import { toast } from '@/lib/toast';
import { useShareCard } from '@/hooks/use-share-card';
import { useRequireAuth } from '@/hooks/use-require-auth';
import Image from 'next/image';
import { categoryEmoji } from '@/constants/emoji-map';
import { secureImageUrl } from '@/lib/secure-image-url';
import { Illustration } from '@/components/brand/Illustration';
import { travelTypeIllustration } from '@/constants/illustration-map';
import styles from './TravelTypeResult.module.scss';

/**
 * 여행 유형 결과 화면.
 *
 * 데이터 소스: useMyTravelType (GET /travel-types/me)
 *   - Quiz 직후 진입 시 submit 의 onSuccess 가 같은 queryKey 에 결과를 setQueryData.
 *   - 새로고침/딥링크 진입 시에도 me API 가 저장된 결과 반환.
 *   - 결과 없음(처음 진입 또는 만료) → /travel-type 으로 redirect.
 *
 * 구성:
 *   1) 결과 hero — emoji + 유형 코드 + title + 키워드 chip
 *   2) description
 *   3) 추천 여행지 3 (서버 응답의 recommended 그대로)
 *   4) 액션 — 공유 카드 / 다시 테스트
 *
 * UI 가 유형 코드를 분기하지 않음 — title/description/emoji/keywords/recommended 모두
 * 서버 응답 그대로 사용. 추후 유형 추가/변경 시 코드 수정 없이 자동 반영.
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

  // file 단독 — title/text 동반 시 일부 share target (카카오톡 등) 이 텍스트만
  // 클립보드로 분리 처리하고 file 첨부 흐름이 끊긴다.
  const handleShare = (result: TravelTypeDto) => {
    haptic.tap();
    const params = new URLSearchParams({
      type: result.code,
      name: result.title,
      ...(result.description ? { tagline: result.description } : {}),
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
          <button
            type="button"
            className={styles.retry}
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
          >
            {t('startTest')}
          </button>
        }
      />
    );
  }

  const result: TravelTypeDto = data;
  const resultArt = travelTypeIllustration(result.code);
  const keywords = result.keywords ?? [];
  const recommended = result.recommended ?? [];

  return (
    <div className={styles.wrap}>
      <Card variant="highlighted" padding="lg" className={styles.hero}>
        {/* Figma `tripTypeIcon` 에셋. 서버 코드가 매핑에 없으면 API emoji fallback */}
        <div className={styles.heroEmoji} aria-hidden>
          {resultArt ? (
            <Illustration name={resultArt} size={52} />
          ) : (
            result.emoji
          )}
        </div>
        <Chip variant="primary" size="sm" className={styles.codeBadge}>
          {result.code}
        </Chip>
        <h2 className={styles.title}>{result.title}</h2>
        {keywords.length > 0 && (
          <ul className={styles.keywords} aria-label={t('keywordsAria')}>
            {keywords.map((k) => (
              <li key={k}>
                <Chip variant="outline" size="sm">
                  {k}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        {result.description && (
          <p className={styles.description}>{result.description}</p>
        )}
      </Card>

      {recommended.length > 0 && (
        <section className={styles.recommend}>
          <h3 className={styles.recommendTitle}>{t('recommendTitle')}</h3>
          <ul className={styles.recommendList}>
            {recommended.map((d) => {
              const region = CHUNGBUK_REGIONS.find((r) => r.code === d.region);
              const regionLabel = region?.ko ?? d.region;
              const safeImg = secureImageUrl(d.imageUrl);
              return (
                <li key={d.id} className={styles.recommendItem}>
                  <span className={styles.recEmoji} aria-hidden>
                    {safeImg ? (
                      <Image
                        src={safeImg}
                        alt=""
                        fill
                        sizes="40px"
                        className={styles.recPhoto}
                      />
                    ) : (
                      categoryEmoji(d.category)
                    )}
                  </span>
                  <div className={styles.recText}>
                    <p className={styles.recName}>{d.name}</p>
                    <p className={styles.recMeta}>{regionLabel}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <ButtonGrid>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => handleShare(result)}
            leadingIcon={<Share2 size={16} aria-hidden />}
          >
            {t('share')}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
            leadingIcon={<RotateCcw size={16} aria-hidden />}
          >
            {t('retake')}
          </Button>
        </ButtonGrid>
        <Button
          variant="primary"
          fullWidth
          onClick={() => handleApply(result)}
          loading={applyMutation.isPending}
          leadingIcon={<BadgeCheck size={16} aria-hidden />}
        >
          {t('apply')}
        </Button>
      </div>
    </div>
  );
}
