'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Share2 } from 'lucide-react';
import { SubHeader } from '@/components/layout/SubHeader';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button, IconButton } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { useDestinationDetail } from '@/features/tournament/hooks/use-tournament';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { shareUrl } from '@/lib/share';
import { toast } from '@/lib/toast';
import styles from './DestinationDetailClient.module.scss';

const CATEGORY_EMOJI: Record<string, string> = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
  local: '🏘️',
};

/**
 * 여행지 상세 client — `useDestinationDetail` 로 fetch 후 풍부한 메타 표시.
 *
 * Layout (위 → 아래):
 *   1) SubHeader        — 뒤로가기 + detail.name (fetch 후 채움)
 *   2) Hero             — 카테고리 이모지 + 시군 + 카테고리 라벨
 *   3) Name             — 큰 제목
 *   4) WinnerDetailPanel — 요약 + 평점 + 태그 + 주소/시간/입장료/연락처/웹사이트
 *   5) bestSeasons      — 추천 계절 chip (detail 있을 때만)
 *
 * isLoading / isError / 데이터 없음 모두 STYLES.md 표준 (Skeleton / EmptyState).
 */
export function DestinationDetailClient({ id }: { id: string }) {
  const t = useTranslations('destination');
  const tCommon = useTranslations('common');
  const tSeason = useTranslations('tournament.season');
  const tCategory = useTranslations('tournament.category');
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useDestinationDetail(id);

  const handleShare = async () => {
    if (!detail) return;
    const result = await shareUrl({
      url: `/destination/${id}`,
      title: detail.name,
      text: detail.summary ?? detail.description,
    });
    if (result === 'copied') toast.success(tCommon('shareLinkCopied'));
    else if (result === 'failed') toast.error(tCommon('shareFailed'));
    // 'shared' / 'cancelled' 은 silent — OS sheet 에서 사용자 자체 인지.
  };

  // detail 없을 때도 안정적인 header 유지 (CLS 0).
  const title = detail?.name ?? '';

  // share 버튼은 detail 있을 때만 활성화 (없으면 공유할 내용 자체 없음).
  const shareSlot = detail ? (
    <IconButton
      aria-label={tCommon('share')}
      variant="ghost"
      size="md"
      onClick={handleShare}
    >
      <Share2 size={20} aria-hidden />
    </IconButton>
  ) : undefined;

  if (isError) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <EmptyState
            icon={<AlertCircle size={28} aria-hidden />}
            title={t('errorTitle')}
            description={t('errorDescription')}
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  if (isLoading || !detail) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <div className={styles.hero} aria-hidden>
            <Skeleton width={64} height={64} radius="full" />
            <Skeleton width="40%" height={14} radius="sm" />
          </div>
          <Skeleton width="70%" height={28} radius="md" />
          <Skeleton width="100%" height={120} radius="lg" />
        </div>
      </>
    );
  }

  const regionName =
    CHUNGBUK_REGIONS.find((r) => r.code === detail.region)?.ko ?? detail.region;
  const emoji = CATEGORY_EMOJI[detail.category] ?? '📍';

  return (
    <>
      <SubHeader title={title} rightSlot={shareSlot} />
      <article className={styles.wrap} aria-labelledby="destination-name">
        <header className={styles.hero}>
          <span className={styles.heroEmoji} aria-hidden>
            {emoji}
          </span>
          <p className={styles.heroMeta}>
            <span className={styles.heroRegion}>{regionName}</span>
            <span aria-hidden className={styles.dot}>
              ·
            </span>
            <span className={styles.heroCategory}>
              {tCategory(detail.category as Parameters<typeof tCategory>[0])}
            </span>
          </p>
        </header>

        <h1 id="destination-name" className={styles.name}>
          {detail.name}
        </h1>

        {/* 풍부한 detail (summary/rating/tags/address/시간/입장료/연락처/web) */}
        <WinnerDetailPanel detail={detail} isLoading={false} />

        {detail.bestSeasons && detail.bestSeasons.length > 0 && (
          <section
            className={styles.seasons}
            aria-label={t('bestSeasonsLabel')}
          >
            <h2 className={styles.sectionTitle}>{t('bestSeasonsLabel')}</h2>
            <ul className={styles.seasonChips}>
              {detail.bestSeasons.map((s) => (
                <li key={s} className={styles.seasonChip}>
                  {tSeason(s)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
