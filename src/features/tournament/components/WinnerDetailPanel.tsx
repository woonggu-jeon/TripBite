'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Clock, CalendarX } from 'lucide-react';
import type { DestinationDetailDto } from '@/api/generated/schemas';
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
    if (!expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text, expanded]);

  return (
    <div className={styles.summaryWrap}>
      <p
        ref={ref}
        className={`${styles.summary} ${expanded ? '' : styles.clamped}`}
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
  detail: DestinationDetailDto | undefined;
  isLoading: boolean;
}

/**
 * 토너먼트 우승 info-card — Figma "TRN · 토너먼트 결과" info-card (320×285) 정합.
 *
 * 구성 (위→아래):
 *   - title B_16 "장소 정보"
 *   - 3 field row (gap 12): pin/calendar/clock 추첨 후보 = 주소/휴무일/운영시간
 *     · 각 row: flabel 86 (icon 18 primary + label Caption R_12 muted) + value R_12 fg
 *   - divider 1px gray
 *   - overview column gap 8: text Body R_14 muted line 80h + "더보기" SemiBold 14 primary
 *
 * 데이터 정책:
 *   - 모든 필드 optional. 표시할 정보가 아무것도 없으면 패널 미노출.
 *   - 로딩 중엔 skeleton.
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

  // Figma 정합: pin / calendar / clock 3 row 만. (phone/website/parking 등은 미노출)
  const rows: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
  }> = [];
  if (detail.address)
    rows.push({
      key: 'address',
      icon: <MapPin size={18} aria-hidden />,
      label: t('address'),
      value: detail.address,
    });
  if (detail.restDate)
    rows.push({
      key: 'restDate',
      icon: <CalendarX size={18} aria-hidden />,
      label: t('restDate'),
      value: detail.restDate,
    });
  if (detail.openingHours)
    rows.push({
      key: 'hours',
      icon: <Clock size={18} aria-hidden />,
      label: t('openingHours'),
      value: detail.openingHours,
    });

  const lead = detail.description;
  const hasLead = !!lead;
  const hasRows = rows.length > 0;

  if (!hasLead && !hasRows) return null;

  return (
    <section className={styles.panel} aria-label={t('panelLabel')}>
      <h3 className={styles.title}>{t('panelLabel')}</h3>

      {hasRows && (
        <dl className={styles.rows}>
          {rows.map((r) => (
            <div key={r.key} className={styles.row}>
              <dt className={styles.rowLabel}>
                <span className={styles.rowIcon}>{r.icon}</span>
                <span className={styles.rowLabelText}>{r.label}</span>
              </dt>
              <dd className={styles.rowValue}>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {hasRows && hasLead && <div className={styles.divider} aria-hidden />}

      {hasLead && <ExpandableSummary text={lead} />}
    </section>
  );
}
