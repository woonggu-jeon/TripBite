'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { SubHeader } from '@/components/layout/SubHeader';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { useDestinationDetail } from '@/features/tournament/hooks/use-tournament';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { categoryEmoji } from '@/constants/emoji-map';
import { secureImageUrl } from '@/lib/secure-image-url';
import { DestinationPhotos } from './DestinationPhotos';
import { DestinationActions } from './DestinationActions';
import { RelatedDestinations } from './RelatedDestinations';
import styles from './DestinationDetailClient.module.scss';

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
  const tSeason = useTranslations('tournament.season');
  const tCategory = useTranslations('tournament.category');
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useDestinationDetail(id);

  // detail 없을 때도 안정적인 header 유지 (CLS 0).
  // 공유 버튼은 본문 DestinationActions 로 이동 — SubHeader rightSlot 제거.
  const title = detail?.name ?? '';

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
  const emoji = categoryEmoji(detail.category);
  const safeHeroImg = secureImageUrl(detail.imageUrl);

  return (
    <>
      <SubHeader title={title} />
      <article className={styles.wrap} aria-labelledby="destination-name">
        {/* 1) 사진 영역 — photos 있으면 carousel, 없으면 imageUrl 단일 hero */}
        <DestinationPhotos
          photos={detail.photos}
          imageUrl={detail.imageUrl}
          alt={detail.name}
        />

        {/* 2) Hero — 대표사진(imageUrl) thumbnail + 시군 · 카테고리. 사진 없으면 emoji fallback */}
        <header className={styles.hero}>
          <div className={styles.heroEmoji} aria-hidden>
            {safeHeroImg ? (
              <Image
                src={safeHeroImg}
                alt=""
                fill
                sizes="80px"
                className={styles.heroPhoto}
              />
            ) : (
              <span className={styles.heroEmojiGlyph}>{emoji}</span>
            )}
          </div>
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

        {/* 3) Name */}
        <h1 id="destination-name" className={styles.name}>
          {detail.name}
        </h1>

        {/* 4) 장소 정보 (summary / rating / tags / 주소 / 시간 / 입장료 / 연락처 / web) */}
        <WinnerDetailPanel detail={detail} isLoading={false} />

        {/* 5) 추천 계절 chips */}
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

        {/* 6) 이 시군의 다른 여행지 (Carousel) */}
        <RelatedDestinations id={id} />

        {/* 7) Actions row — 카카오 길찾기 + 공유. (네이버 분기는 코드에 주석으로 유지) */}
        <DestinationActions
          id={id}
          name={detail.name}
          coords={detail.coords}
          shareText={detail.description}
        />
      </article>
    </>
  );
}
