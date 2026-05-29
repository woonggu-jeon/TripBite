'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Phone, Globe, Clock, Ticket, Star } from 'lucide-react';
import type { DestinationDetail } from '@/features/tournament/types';
import styles from './WinnerDetailPanel.module.scss';

interface Props {
  detail: DestinationDetail | undefined;
  isLoading: boolean;
}

/**
 * 우승 여행지 상세 패널 — API 응답의 optional 필드를 있는 것만 렌더.
 *
 * 설계 원칙:
 *   - 모든 필드 optional → 백엔드가 점진적으로 채우거나, 특정 destination 에 정보가
 *     없어도 패널 자체는 깨지지 않음
 *   - 데이터 없으면 해당 row 자체 미노출 (빈 공간/대시 X)
 *   - 표시할 정보가 아무것도 없으면 패널 전체 미노출
 *   - 로딩 중엔 skeleton — 우승 카드만 먼저 보이고 상세는 비동기로 채워짐
 *     ("렌더 속도 최우선" 정책: 상세 fetch 가 늦어도 winner/stats 는 즉시 표시)
 */
export function WinnerDetailPanel({ detail, isLoading }: Props) {
  const t = useTranslations('tournament.result.detail');

  if (isLoading) {
    return (
      <div className={styles.skeleton} aria-hidden>
        <span className={styles.skelLine} />
        <span className={`${styles.skelLine} ${styles.skelLineShort}`} />
        <span className={styles.skelLine} />
      </div>
    );
  }

  if (!detail) return null;

  const rows: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
  }> = [];
  if (detail.address)
    rows.push({
      key: 'address',
      icon: <MapPin size={16} aria-hidden />,
      label: t('address'),
      value: detail.address,
    });
  if (detail.openingHours)
    rows.push({
      key: 'hours',
      icon: <Clock size={16} aria-hidden />,
      label: t('openingHours'),
      value: detail.openingHours,
    });
  if (detail.admissionFee)
    rows.push({
      key: 'fee',
      icon: <Ticket size={16} aria-hidden />,
      label: t('admissionFee'),
      value: detail.admissionFee,
    });
  if (detail.phone)
    rows.push({
      key: 'phone',
      icon: <Phone size={16} aria-hidden />,
      label: t('phone'),
      value: detail.phone,
    });
  if (detail.website)
    rows.push({
      key: 'website',
      icon: <Globe size={16} aria-hidden />,
      label: t('website'),
      value: detail.website,
    });

  const hasSummary = !!detail.summary;
  const hasRating = !!detail.rating;
  const hasTags = !!detail.tags && detail.tags.length > 0;
  const hasRows = rows.length > 0;

  if (!hasSummary && !hasRating && !hasTags && !hasRows) return null;

  return (
    <section className={styles.panel} aria-label={t('panelLabel')}>
      {hasSummary && <p className={styles.summary}>{detail.summary}</p>}

      {(hasRating || hasTags) && (
        <div className={styles.metaRow}>
          {hasRating && detail.rating && (
            <span className={styles.rating}>
              <Star
                size={14}
                fill="currentColor"
                aria-hidden
                className={styles.starIcon}
              />
              <span className={styles.ratingValue}>
                {detail.rating.value.toFixed(1)}
              </span>
              <span className={styles.ratingCount}>
                ({t('reviewCount', { n: detail.rating.count })})
              </span>
            </span>
          )}
          {hasTags && detail.tags && (
            <ul className={styles.tags}>
              {detail.tags.map((tg) => (
                <li key={tg} className={styles.tag}>
                  {tg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasRows && (
        <dl className={styles.rows}>
          {rows.map((r) => {
            const isLink = r.key === 'website';
            return (
              <div key={r.key} className={styles.row}>
                <dt className={styles.rowLabel}>
                  <span className={styles.rowIcon}>{r.icon}</span>
                  <span className={styles.rowLabelText}>{r.label}</span>
                </dt>
                <dd className={styles.rowValue}>
                  {isLink ? (
                    <a
                      href={r.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.rowLink}
                    >
                      {r.value}
                    </a>
                  ) : (
                    r.value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}
