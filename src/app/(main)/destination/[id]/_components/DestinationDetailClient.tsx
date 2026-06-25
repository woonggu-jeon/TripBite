'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon/Icon';
import { SubHeader } from '@/components/layout/SubHeader';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { useDestinationDetail } from '@/features/tournament/hooks/use-tournament';
import type { DestinationDetailDto } from '@/api/generated/schemas';
import { DestinationPhotos } from './DestinationPhotos';
import { DestinationActions } from './DestinationActions';
import { RelatedDestinations } from './RelatedDestinations';
import styles from './DestinationDetailClient.module.scss';

/**
 * 여행지 상세 client — Figma "POI · 장소상세" (2026-06-23) 정합.
 *
 * Layout:
 *   1) SubHeader (페이지 h1)
 *   2) DestinationPhotos hero (360×234 carousel + dots overlay)
 *   3) info-sec (padding 20 20 24 gap 20 white bg):
 *      · title-area row — Frame 28 (name B_20 + region SemiBold 14 muted) +
 *        type-chip pill (compass + Caption R_12 primary).
 *      · info-card column gap 12 — 5 field row (pin/clock/calendar/parking/
 *        globe, icon 18 primary + flabel R_12 muted + value R_12 fg).
 *      · divider 1px gray.
 *      · overview column gap 8 — text R_14 muted + "more" SemiBold 14 primary
 *        토글 (긴 description 3-4 줄 clamp + 펼치기).
 *   4) near-sec (padding 20) — RelatedDestinations (3 horizontal scroll).
 *   5) action-bar (padding 12 20 row gap 8) — outline primary + fill primary.
 *
 * WinnerDetailPanel 사용 중단 — 자체 info-card / overview markup (panel 은
 * TournamentResult 와 공유 — 변경 시 영향 큼). 같은 detail data, 시각만
 * Figma 정확 정합.
 */
const OVERVIEW_LINE_CLAMP = 4;

export function DestinationDetailClient({ id }: { id: string }) {
  const t = useTranslations('destination');
  const tInfo = useTranslations('destination.info');
  const tCategory = useTranslations('tournament.category');
  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useDestinationDetail(id);
  const title = detail?.name ?? '';

  if (isError) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <EmptyState
            icon={<Icon name="alert-circle" size={28} />}
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
    // Figma layout 대응 skeleton — hero 234 + info-sec (title-area + info-card
    // 5 field + divider + overview) + near-sec 3 card. CLS 0.
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <Skeleton width="100%" height={234} radius="sm" />
          <div className={styles.infoSec}>
            <div className={styles.titleArea}>
              <div className={styles.titleStack}>
                <Skeleton width="60%" height={26} radius="sm" />
                <Skeleton width="40%" height={20} radius="sm" />
              </div>
              <Skeleton width={72} height={25} radius="full" />
            </div>
            <div className={styles.infoCard}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="100%" height={18} radius="sm" />
              ))}
            </div>
            <div className={styles.divider} aria-hidden />
            <Skeleton width="100%" height={80} radius="sm" />
          </div>
          <div className={styles.nearSec}>
            <Skeleton width="40%" height={22} radius="sm" />
            <div className={styles.skeletonRelatedRow} aria-hidden>
              <Skeleton width={152} height={168} radius="md" />
              <Skeleton width={152} height={168} radius="md" />
              <Skeleton width={152} height={168} radius="md" />
            </div>
          </div>
        </div>
      </>
    );
  }

  const regionName =
    CHUNGBUK_REGIONS.find((r) => r.code === detail.region)?.ko ?? detail.region;
  const categoryLabel = tCategory(
    detail.category as Parameters<typeof tCategory>[0],
  );

  return (
    <>
      <SubHeader title={title} />
      <article className={styles.wrap} aria-labelledby="destination-name">
        {/* Figma hero — 360×234 carousel + dots overlay. */}
        <DestinationPhotos
          photos={detail.photos}
          imageUrl={detail.imageUrl}
          alt={detail.name}
        />

        {/* Figma info-sec — padding 20 20 24 gap 20 white. */}
        <section className={styles.infoSec}>
          {/* Figma title-area — row space-between. */}
          <div className={styles.titleArea}>
            <div className={styles.titleStack}>
              <h2 id="destination-name" className={styles.name}>
                {detail.name}
              </h2>
              <p className={styles.region}>{regionName}</p>
            </div>
            <span className={styles.typeChip}>
              <Icon name="compass" size={13} />
              <span>{categoryLabel}</span>
            </span>
          </div>

          {/* Figma info-card — column gap 12. 5 field row (label width 86,
              value Caption R_12 fg). 빈 field 는 미노출 (정보 없는 row 회피). */}
          <InfoCard detail={detail} t={tInfo} />

          {/* Figma divider 1px gray. */}
          <div className={styles.divider} aria-hidden />

          {/* Figma overview — text R_14 muted + "more" SemiBold 14 primary. */}
          {detail.description && (
            <Overview text={detail.description} t={tInfo} />
          )}
        </section>

        {/* Figma near-sec — padding 20 white bg. */}
        <section className={styles.nearSec}>
          <RelatedDestinations id={id} />
        </section>

        {/* Figma action-bar — outline primary + fill primary 2 button. */}
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

function InfoCard({
  detail,
  t,
}: {
  detail: DestinationDetailDto;
  t: ReturnType<typeof useTranslations<'destination.info'>>;
}) {
  // Figma 5 field — value 가 있는 row 만 노출 (빈 row 미노출).
  const fields: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    isLink?: boolean;
  }> = [];
  if (detail.address) {
    fields.push({
      key: 'address',
      icon: <Icon name="location" size={18} />,
      label: t('address'),
      value: detail.address,
    });
  }
  if (detail.openingHours) {
    fields.push({
      key: 'openingHours',
      icon: <Icon name="clock" size={18} />,
      label: t('openingHours'),
      value: detail.openingHours,
    });
  }
  if (detail.restDate) {
    fields.push({
      key: 'restDate',
      icon: <Icon name="calendar" size={18} />,
      label: t('restDate'),
      value: detail.restDate,
    });
  }
  if (detail.parking) {
    fields.push({
      key: 'parking',
      icon: <Icon name="parking" size={18} />,
      label: t('parking'),
      value: detail.parking,
    });
  }
  if (detail.website) {
    fields.push({
      key: 'website',
      icon: <Icon name="globe" size={18} />,
      label: t('website'),
      value: detail.website,
      isLink: true,
    });
  }
  if (fields.length === 0) return null;

  return (
    <dl className={styles.infoCard}>
      {fields.map((f) => (
        <div key={f.key} className={styles.field}>
          <dt className={styles.flabel}>
            <span className={styles.fieldIcon} aria-hidden>
              {f.icon}
            </span>
            <span className={styles.flabelText}>{f.label}</span>
          </dt>
          <dd
            className={`${styles.fvalue} ${f.isLink ? styles.fvalueLink : ''}`}
          >
            {f.isLink ? (
              <a
                href={f.value}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkText}
              >
                {f.value}
              </a>
            ) : (
              f.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Overview({
  text,
  t,
}: {
  text: string;
  t: ReturnType<typeof useTranslations<'destination.info'>>;
}) {
  const [expanded, setExpanded] = useState(false);
  // 줄바꿈 또는 \n 자체가 4줄 초과시에만 토글 의미 — 단순 length 기준 fallback.
  const isLong =
    text.length > 140 || text.split(/\n|\r/).length > OVERVIEW_LINE_CLAMP;
  return (
    <div className={styles.overview}>
      <p
        className={`${styles.overviewText} ${
          expanded ? styles.overviewTextExpanded : ''
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          className={styles.overviewMore}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t('less') : t('more')}
        </button>
      )}
    </div>
  );
}
