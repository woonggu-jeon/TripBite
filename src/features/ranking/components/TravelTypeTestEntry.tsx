'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cardClasses } from '@/components/ui';
import { useMyTravelType } from '@/features/ranking/hooks/use-ranking';
import styles from './TravelTypeTestEntry.module.scss';

/**
 * 여행 유형 테스트 진입 배너.
 *
 *   - 결과 없음 → "지금 테스트하기" (5문항 안내)
 *   - 결과 있음 → 내 유형 emoji + title + "다시 결과 보기"
 *
 * 랭킹 페이지/홈 위젯 등 어디서든 import 가능. 데이터는 useMyTravelType (서버 단일 소스).
 *
 * [보존/preserved] 현재 랭킹/홈에서 미마운트(여행유형 진입 위젯 노출 보류 상태)라
 * 미사용. 위젯 재노출 시 재사용하는 설계 완료 UI — dead-code sweep 에서 제외(의도적 보존).
 */
export function TravelTypeTestEntry() {
  const t = useTranslations('travelType.entry');
  const { data } = useMyTravelType();

  const cardCls = cardClasses({
    variant: 'surface',
    className: styles.card,
  });

  if (data) {
    return (
      <Link href="/quiz/result" className={cardCls}>
        <span className={styles.emoji} aria-hidden>
          {data.emoji}
        </span>
        <div className={styles.text}>
          <p className={styles.eyebrow}>{t('myTypeEyebrow')}</p>
          <p className={styles.title}>{data.title}</p>
        </div>
        <ArrowRight className={styles.arrow} size={18} aria-hidden />
      </Link>
    );
  }

  return (
    <Link href="/quiz" className={`${cardCls} ${styles.cta}`}>
      <span className={styles.emoji} aria-hidden>
        🧭
      </span>
      <div className={styles.text}>
        <p className={styles.eyebrow}>{t('ctaEyebrow')}</p>
        <p className={styles.title}>{t('ctaTitle')}</p>
      </div>
      <ArrowRight className={styles.arrow} size={18} aria-hidden />
    </Link>
  );
}
