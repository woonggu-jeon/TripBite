'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ThemeSelector } from '@/features/tournament/components/ThemeSelector';
import { CategoryFilter } from '@/features/tournament/components/CategoryFilter';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import type {
  DestinationCategory,
  TournamentCount,
  TournamentTheme,
} from '@/features/tournament/types';
import { haptic } from '@/lib/haptic';
import styles from './TournamentSetup.module.scss';

/**
 * 토너먼트 설정 화면 (Phase 1)
 *
 * 흐름: theme → categories(다중) → count → 시작
 *   → store.setConfig(...) + router.push('/tournament/play')
 *
 * Phase 2에서 region 필터 + 충북 지도 + 계절 파티클 추가 예정.
 */
export function TournamentSetup() {
  const router = useRouter();
  const t = useTranslations('tournament.setup');
  const setConfig = useTournamentStore((s) => s.setConfig);

  const [theme, setTheme] = useState<TournamentTheme | null>(null);
  const [categories, setCategories] = useState<DestinationCategory[]>([]);
  const [count, setCount] = useState<TournamentCount | null>(null);

  const ready = theme !== null && categories.length > 0 && count !== null;

  const handleStart = () => {
    if (!ready || theme === null || count === null) return;
    haptic.success();
    setConfig({ theme, categories, count });
    router.push('/tournament/play');
  };

  return (
    <div className={styles.wrap}>
      <Section title={t('themeSection')} hint={t('themeHint')}>
        <ThemeSelector value={theme} onChange={setTheme} />
      </Section>

      <Section title={t('categorySection')} hint={t('categoryHint')}>
        <CategoryFilter values={categories} onChange={setCategories} />
      </Section>

      <Section title={t('countSection')} hint={t('countHint')}>
        <CountSelector value={count} onChange={setCount} />
      </Section>

      <div className={styles.cta}>
        <button
          type="button"
          className={styles.start}
          onClick={handleStart}
          disabled={!ready}
        >
          {t('start')}
        </button>
        {!ready && <p className={styles.startHint}>{t('startHint')}</p>}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {hint && <p className={styles.hint}>{hint}</p>}
      </header>
      {children}
    </section>
  );
}
