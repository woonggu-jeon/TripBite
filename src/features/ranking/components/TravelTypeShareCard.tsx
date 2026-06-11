'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Share2, ChevronLeft } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button, Card, Chip, IconButton } from '@/components/ui';
import { useMyTravelType } from '@/features/ranking/hooks/use-ranking';
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

      {/* 정사각 공유 카드 — 추후 html2canvas/dom-to-image 로 PNG 추출 */}
      <Card
        as="article"
        variant="highlighted"
        padding="lg"
        className={styles.card}
        aria-label={data.title}
      >
        <span className={styles.cardEmoji} aria-hidden>
          {data.emoji}
        </span>
        <Chip variant="outline" size="sm" className={styles.cardCode}>
          {data.code}
        </Chip>
        <h3 className={styles.cardTitle}>{data.title}</h3>
        {keywords.length > 0 && (
          <ul className={styles.cardKeywords}>
            {keywords.map((k) => (
              <li key={k}>
                <Chip variant="default" size="sm">
                  {k}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        <p className={styles.cardBrand}>TripBite · 여행 유형 테스트</p>
      </Card>

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
