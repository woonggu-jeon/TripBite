'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  CalendarX,
  CircleParking,
} from 'lucide-react';
import type { DestinationDetail } from '@/features/tournament/types';
import styles from './WinnerDetailPanel.module.scss';

/**
 * 4 줄 line-clamp + 더보기 / 접기 토글. 짧아서 clamp 안 걸리면 토글 미노출.
 * detail.description (TourAPI overview) 가 500-2000 bytes 까지 길 수 있어 카드 레이아웃 안정성 위해.
 */
function ExpandableSummary({ text }: { text: string }) {
  const tCommon = useTranslations('common');
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 화면 paint 후 scrollHeight 가 정확. expanded 토글 시 측정 안 함 (오버플로우 판정은 clamp 상태 기준).
    if (!expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className={styles.summaryWrap}>
      <p
        ref={ref}
        className={`${styles.summary} ${expanded ? styles.expanded : styles.clamped}`}
      >
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={styles.expandToggle}
          aria-expanded={expanded}
        >
          {expanded ? tCommon('showLess') : tCommon('showMore')}
        </button>
      )}
    </div>
  );
}

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
  if (detail.restDate)
    rows.push({
      key: 'restDate',
      icon: <CalendarX size={16} aria-hidden />,
      label: t('restDate'),
      value: detail.restDate,
    });
  if (detail.parking)
    rows.push({
      key: 'parking',
      icon: <CircleParking size={16} aria-hidden />,
      label: t('parking'),
      value: detail.parking,
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

  // BE 가 summary 폐기 + description 통합 (API_CONTRACT 2026-06-11) — overview 전체 또는 한글 폴백.
  const lead = detail.description;
  const hasLead = !!lead;
  const hasRows = rows.length > 0;

  if (!hasLead && !hasRows) return null;

  return (
    <section className={styles.panel} aria-label={t('panelLabel')}>
      {hasLead && <ExpandableSummary text={lead} />}

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
