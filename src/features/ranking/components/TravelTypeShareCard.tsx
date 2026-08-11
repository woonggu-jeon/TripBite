'use client';

import { ChevronLeft, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Illustration } from '@/components/brand/Illustration';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button, IconButton } from '@/components/ui';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { travelTypeIllustration } from '@/constants/illustration-map';
import { TRAVEL_TYPE_MATCH, TRAVEL_TYPE_META } from '@/constants/travel-types';
import { useMyTravelType } from '@/features/ranking/hooks/use-ranking';
import { haptic } from '@/lib/haptic';
import styles from './TravelTypeShareCard.module.scss';

/**
 * 여행 유형 공유 카드.
 *
 * 데이터: useMyTravelType (서버 응답 그대로). 결과 없음 시 /travel-type 으로 redirect.
 *
 * 공유:
 *   - Web Share API (navigator.share) 우선 사용
 *   - 미지원/실패 시 클립보드 복사 fallback
 *   - 이미지 추출(html2canvas 등)은 추후 — 현재는 텍스트 + URL share
 */
export function TravelTypeShareCard() {
  const t = useTranslations('travelType.share');
  const tCommon = useTranslations('brand');
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

  const cardArt = travelTypeIllustration(data.code);
  const bestCode = TRAVEL_TYPE_MATCH[data.code].best.code;
  const tags = data.tags ?? [];
  const shareText =
    tags.length > 0
      ? `${data.emoji} ${data.title} — ${tags.join(' ')}`
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
    // clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${shareText}\n${shareData.url ?? ''}`,
        );
      } catch {
        // 무시 — 마지막 사용자 알림은 toast 인프라가 있으면 연결
      }
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={t('back')}
          onClick={() => {
            haptic.tap();
            router.back();
          }}
        >
          <ChevronLeft size={22} />
        </IconButton>
        <h2 className={styles.heading}>{t('heading')}</h2>
        <span aria-hidden className={styles.headSpacer} />
      </header>

      {/* Figma `TST · 공유 이미지 카드` (3413:4733) — 360x360, #EAF6EF,
          padding 40/20/20. /api/og/quiz 가 만드는 PNG 와 같은 구성이라
          이 화면이 그 미리보기 역할을 한다. */}
      <article className={styles.card} aria-label={data.title}>
        <div className={styles.typeBlock}>
          <span className={styles.cardIcon} aria-hidden>
            {cardArt ? <Illustration name={cardArt} size={52} /> : data.emoji}
          </span>
          {/* 시안 pill 은 초록 면 + 흰 글씨 (구 구현은 outline) */}
          <span className={styles.cardCode}>{data.code}</span>
          <h3 className={styles.cardTitle}>{data.title}</h3>
          {tags.length > 0 && (
            <ul className={styles.cardKeywords}>
              {tags.map((k) => (
                <li key={k} className={styles.cardKeyword}>
                  {k}
                </li>
              ))}
            </ul>
          )}
          {data.description && (
            <p className={styles.cardDesc}>{data.description}</p>
          )}
        </div>

        {/* 시안 `match-line` — 흰 pill + 1px 초록, 💚 + "환상의 짝꿍 · N" */}
        <p className={styles.matchLine}>
          <span aria-hidden>💚</span>
          {t('matchPrefix', { type: TRAVEL_TYPE_META[bestCode].title })}
        </p>

        {/* 시안 `Frame 6` — 로고 + "여행한입" (구 구현은 "TripBite · …" 텍스트) */}
        <p className={styles.cardBrand}>
          <BrandLogo width={28} ariaHidden />
          {tCommon('name')}
        </p>
      </article>

      <Button
        variant="primary"
        fullWidth
        onClick={handleShare}
        leadingIcon={<Share2 size={18} aria-hidden />}
      >
        {t('shareCta')}
      </Button>
      <p className={styles.shareHint}>{t('shareHint')}</p>
    </div>
  );
}
