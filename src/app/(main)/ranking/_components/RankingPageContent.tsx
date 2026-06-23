'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button } from '@/components/ui';
import { WeekLabel } from '@/components/ui/WeekLabel';
import { useWeeklyTopDestinations } from '@/features/ranking/hooks/use-ranking';
import { RegionWinsChart } from '@/features/ranking/components/RegionWinsChart';
import { isRegionCode } from '@/constants/regions';
import { secureImageUrl } from '@/lib/secure-image-url';
import { haptic } from '@/lib/haptic';
import styles from './RankingPageContent.module.scss';

/**
 * 랭킹 페이지 — Figma "RNK · 랭킹" (2026-06-23) 정합.
 *
 * Layout:
 *   - WeekLabel inline ("M월 N주차 · ...")
 *   - rv-card 1 "이번 주 인기 여행지":
 *     · title B_16 fg + padding-bottom 16
 *     · hero (rank 1): 288×152 image + dark overlay + B_20 title 좌하단 +
 *       row (시군 + 우승 횟수) white.
 *     · top5-row × 4 (rank 2-5): num 16 SB_16 disabled + circle 48
 *       thumbnail + name B_14 + region Caption R_12 muted.
 *   - rv-card 2 "시군별 우승 횟수":
 *     · title B_16 fg + padding-bottom 16
 *     · RegionWinsChart (11 gun-row).
 *
 * 빈 상태 — Figma "RNK · 랭킹 (빈 상태)" 정합 (이전 commit 유지).
 */
export function RankingPageContent() {
  const t = useTranslations('ranking');
  const tSection = useTranslations('ranking.sections');
  const tRegion = useTranslations('region.names');
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useWeeklyTopDestinations(5);
  const isEmpty = !isLoading && !isError && data && data.length === 0;

  if (isEmpty) {
    return (
      <div className={styles.wrap}>
        <WeekLabel variant="inline" hint={t('emptyTallyHint')} />

        <div className={styles.emptyCard}>
          <div className={styles.emptyHead}>
            <span className={styles.emptyHeadTitle}>
              {t('emptyPopular.title')}
            </span>
          </div>
          <div className={styles.emptyCircle} aria-hidden>
            <Trophy size={40} strokeWidth={2.5} />
          </div>
          <div className={styles.emptyText}>
            <p className={styles.emptyTextTitle}>{t('emptyPopular.heading')}</p>
            <p className={styles.emptyTextHint}>{t('emptyPopular.hint')}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              haptic.tap();
              router.push('/tournament');
            }}
          >
            {t('emptyPopular.cta')}
          </Button>
        </div>

        <div className={styles.emptyCardSmall}>
          <div className={styles.emptyHead}>
            <span className={styles.emptyHeadTitle}>
              {t('emptyRecent.title')}
            </span>
          </div>
          <div className={styles.emptyText}>
            <p className={styles.emptyTextTitleDisabled}>
              {t('emptyRecent.heading')}
            </p>
            <p className={styles.emptyTextHintDisabled}>
              {t('emptyRecent.hint')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const top1 = data?.[0];
  const top2to5 = data?.slice(1, 5) ?? [];

  return (
    <div className={styles.wrap}>
      <WeekLabel variant="inline" hint={t('updateNoteShort')} />

      {/* rv-card 1 — 이번 주 인기 여행지 */}
      <section
        className={styles.rvCard}
        aria-label={tSection('weeklyWinners', { limit: 5 })}
      >
        <h2 className={styles.rvTitle}>
          {tSection('weeklyWinners', { limit: 5 })}
        </h2>

        {isLoading && (
          <div className={styles.rvLoading}>
            <Skeleton width="100%" height={152} radius="md" />
            <SkeletonList count={4} height={64} radius="md" />
          </div>
        )}

        {isError && (
          <div className={styles.error}>
            <p>{tSection('error')}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {tSection('retry')}
            </Button>
          </div>
        )}

        {top1 && (
          <>
            <Top1Hero item={top1} tRegion={tRegion} winsUnit={t('winsUnit')} />
            <ul className={styles.top5List}>
              {top2to5.map((item) => (
                <li key={item.destination.id ?? `rank-${item.rank}`}>
                  <Top5Row item={item} tRegion={tRegion} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* rv-card 2 — 시군별 우승 횟수 */}
      <section className={styles.rvCard} aria-label={tSection('byRegionChart')}>
        <h2 className={styles.rvTitle}>{tSection('byRegionChart')}</h2>
        <RegionWinsChart />
      </section>
    </div>
  );
}

function Top1Hero({
  item,
  tRegion,
  winsUnit,
}: {
  item: import('@/features/ranking/types').RankedDestination;
  tRegion: ReturnType<typeof useTranslations<'region.names'>>;
  winsUnit: string;
}) {
  const safeImg = secureImageUrl(item.destination.imageUrl);
  const code = item.destination.region;
  const regionName = isRegionCode(code)
    ? tRegion(code as Parameters<typeof tRegion>[0])
    : code;
  const shortRegion = regionName.replace(/(시|군)$/u, '');

  return (
    <Link
      href={{ pathname: `/destination/${item.destination.id}` }}
      prefetch={false}
      className={styles.hero}
      aria-label={`1위 ${item.destination.name}`}
      onClick={() => haptic.tap()}
    >
      <div className={styles.heroImg} aria-hidden>
        {safeImg && (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, 360px"
            className={styles.heroImage}
          />
        )}
      </div>
      <div className={styles.heroOverlay} aria-hidden />
      <div className={styles.heroText}>
        <h3 className={styles.heroTitle}>{item.destination.name}</h3>
        <div className={styles.heroMeta}>
          <span className={styles.heroRegion}>{shortRegion}</span>
          <span className={styles.heroWins}>
            {item.score}
            {winsUnit}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Top5Row({
  item,
  tRegion,
}: {
  item: import('@/features/ranking/types').RankedDestination;
  tRegion: ReturnType<typeof useTranslations<'region.names'>>;
}) {
  const safeImg = secureImageUrl(item.destination.imageUrl);
  const code = item.destination.region;
  const regionName = isRegionCode(code)
    ? tRegion(code as Parameters<typeof tRegion>[0])
    : code;
  const shortRegion = regionName.replace(/(시|군)$/u, '');

  return (
    <Link
      href={{ pathname: `/destination/${item.destination.id}` }}
      prefetch={false}
      className={styles.top5Row}
      aria-label={`${item.rank}위 ${item.destination.name}`}
      onClick={() => haptic.tap()}
    >
      <span className={styles.top5Num}>{item.rank}</span>
      <span className={styles.top5Thumb} aria-hidden>
        {safeImg && (
          <Image
            src={safeImg}
            alt=""
            fill
            sizes="48px"
            className={styles.top5ThumbImage}
          />
        )}
      </span>
      <div className={styles.top5Text}>
        <p className={styles.top5Name}>{item.destination.name}</p>
        <p className={styles.top5Region}>{shortRegion}</p>
      </div>
    </Link>
  );
}
