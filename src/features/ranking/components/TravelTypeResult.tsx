'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Share2, RotateCcw } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMyTravelType } from '@/features/ranking/hooks/use-ranking';
import type { TravelType } from '@/features/ranking/types';
import styles from './TravelTypeResult.module.scss';

const CATEGORY_EMOJI = {
  local: '🏘️',
  festival: '🎪',
  attraction: '📍',
  experience: '🎨',
} as const;

/**
 * 여행 유형 결과 화면.
 *
 * 데이터 소스: useMyTravelType (GET /travel-types/me)
 *   - Quiz 직후 진입 시 submit 의 onSuccess 가 같은 queryKey 에 결과를 setQueryData.
 *   - 새로고침/딥링크 진입 시에도 me API 가 저장된 결과 반환.
 *   - 결과 없음(처음 진입 또는 만료) → /travel-type 으로 redirect.
 *
 * 구성:
 *   1) 결과 hero — emoji + 유형 코드 + title + 키워드 chip
 *   2) description
 *   3) 추천 여행지 3 (서버 응답의 recommended 그대로)
 *   4) 액션 — 공유 카드 / 다시 테스트
 *
 * UI 가 유형 코드를 분기하지 않음 — title/description/emoji/keywords/recommended 모두
 * 서버 응답 그대로 사용. 추후 유형 추가/변경 시 코드 수정 없이 자동 반영.
 */
export function TravelTypeResult() {
  const t = useTranslations('travelType.result');
  const router = useRouter();
  const { data, isLoading } = useMyTravelType();

  if (isLoading) {
    return <div className={styles.fallback}>{t('loading')}</div>;
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
          <button
            type="button"
            className={styles.retry}
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
          >
            {t('startTest')}
          </button>
        }
      />
    );
  }

  const result: TravelType = data;
  const keywords = result.keywords ?? [];
  const recommended = result.recommended ?? [];

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <div className={styles.heroEmoji} aria-hidden>
          {result.emoji}
        </div>
        <p className={styles.codeBadge}>{result.code}</p>
        <h2 className={styles.title}>{result.title}</h2>
        {keywords.length > 0 && (
          <ul className={styles.keywords} aria-label={t('keywordsAria')}>
            {keywords.map((k) => (
              <li key={k} className={styles.keyword}>
                {k}
              </li>
            ))}
          </ul>
        )}
        {result.description && (
          <p className={styles.description}>{result.description}</p>
        )}
      </section>

      {recommended.length > 0 && (
        <section className={styles.recommend}>
          <h3 className={styles.recommendTitle}>{t('recommendTitle')}</h3>
          <ul className={styles.recommendList}>
            {recommended.map((d) => {
              const region = CHUNGBUK_REGIONS.find((r) => r.code === d.region);
              const regionLabel = region?.ko ?? d.region;
              return (
                <li key={d.id} className={styles.recommendItem}>
                  <span className={styles.recEmoji} aria-hidden>
                    {CATEGORY_EMOJI[d.category]}
                  </span>
                  <div className={styles.recText}>
                    <p className={styles.recName}>{d.name}</p>
                    <p className={styles.recMeta}>{regionLabel}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <Link
          href="/quiz/share"
          className={styles.primary}
          onClick={() => haptic.tap()}
        >
          <Share2 size={18} aria-hidden />
          <span>{t('share')}</span>
        </Link>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            haptic.tap();
            router.replace('/quiz');
          }}
        >
          <RotateCcw size={16} aria-hidden />
          <span>{t('retake')}</span>
        </button>
      </div>
    </div>
  );
}
