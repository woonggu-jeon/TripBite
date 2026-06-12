'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { getCurrentSeason } from '@/features/tournament/utils/season';
import type { Season } from '@/api/generated/schemas';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 빠른시작 2 버튼 — 현재 계절 결정 + 동적 라벨 / 토너먼트 query.
 *
 * Client island 로 분리한 이유: getCurrentSeason() 의 시간대 의존성 격리.
 * SSR 의 server time 과 client time 이 다르면 hydration mismatch. mount 후
 * useEffect 안에서 결정 — 잠깐 fallback 'spring' 노출은 시각상 거의 인지 불가.
 */
export function HomeQuickActions() {
  const t = useTranslations('home.widgets');
  const [season, setSeason] = useState<Season>('spring');

  useEffect(() => {
    setSeason(getCurrentSeason());
  }, []);

  return (
    <section data-widget="quick-actions" className={styles.quickActions}>
      <QuickActionLink
        href={{
          pathname: ROUTES.TOURNAMENT,
          query: { theme: 'season', season },
        }}
        icon={<Trophy size={20} />}
        label={t(`quick.tournamentBySeason.${season}`)}
      />
      <QuickActionLink
        href={ROUTES.QUIZ}
        icon={<Sparkles size={20} />}
        label={t('quick.quiz')}
      />
    </section>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
}: {
  href: React.ComponentProps<typeof Link>['href'];
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href} className={styles.quickAction}>
      <span className={styles.quickActionIcon}>{icon}</span>
      <span className={styles.quickActionLabel}>{label}</span>
    </Link>
  );
}
