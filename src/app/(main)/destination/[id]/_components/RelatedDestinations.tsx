'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useRelatedDestinations } from '@/features/tournament/hooks/use-tournament';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import styles from './RelatedDestinations.module.scss';

const CATEGORY_EMOJI: Record<string, string> = {
  attraction: '📍',
  festival: '🎪',
  experience: '🎨',
  local: '🏘️',
};

/**
 * 이 시군의 다른 여행지 6개.
 *
 * - useRelatedDestinations(id) → GET /destinations/:id/related
 * - 빈 응답 / isError 시 null (graceful — 핵심 흐름 방해 X)
 * - 카드: emoji + name + 카테고리. 클릭 시 /destination/{id}
 */
export function RelatedDestinations({ id }: { id: string }) {
  const t = useTranslations('destination.related');
  const tCategory = useTranslations('tournament.category');
  const { data, isLoading, isError } = useRelatedDestinations(id);

  if (isError) return null;

  if (isLoading) {
    return (
      <section className={styles.wrap} aria-label={t('label')}>
        <h2 className={styles.title}>{t('label')}</h2>
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={68} radius="md" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label={t('label')}>
      <h2 className={styles.title}>{t('label')}</h2>
      <ul className={styles.list}>
        {data.map((d) => {
          const region = CHUNGBUK_REGIONS.find((r) => r.code === d.region);
          const regionLabel = region?.ko ?? d.region;
          return (
            <li key={d.id}>
              <Link
                href={{ pathname: `/destination/${d.id}` }}
                prefetch={false}
                className={styles.card}
                aria-label={d.name}
              >
                <span className={styles.emoji} aria-hidden>
                  {CATEGORY_EMOJI[d.category] ?? '📍'}
                </span>
                <div className={styles.body}>
                  <p className={styles.name}>{d.name}</p>
                  <p className={styles.meta}>
                    {regionLabel} ·{' '}
                    {tCategory(d.category as Parameters<typeof tCategory>[0])}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  aria-hidden
                  className={styles.chevron}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
