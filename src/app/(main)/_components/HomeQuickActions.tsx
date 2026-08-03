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
  const tCommon = useTranslations('common');
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
        cta={tCommon('start')}
        tone="primary"
      />
      <QuickActionLink
        href={ROUTES.QUIZ}
        icon={<Sparkles size={20} />}
        label={t('quick.quiz')}
        cta={tCommon('start')}
        tone="amber"
      />
    </section>
  );
}

/**
 * Figma `qa-banner` — 320x85, H gap 12, padding 12/20, radius 12.
 *   원형 40 (채운 브랜드색 + 흰 아이콘) + 라벨 14 Bold + 우측 "시작" 버튼 80x36
 *
 * 시안에는 라벨 아래 보조 설명 한 줄("16강부터 시작 · 약 2분 소요") 이 더
 * 있으나 레포에 대응 문구가 없어 넣지 않았다 (문구 신설 금지).
 *
 * tone: 토너먼트 = 초록(#EAF6EF 면 / #00B334), 유형테스트 = 주황(#FCEFD9 / #F79D26).
 */
function QuickActionLink({
  href,
  icon,
  label,
  cta,
  tone,
}: {
  href: React.ComponentProps<typeof Link>['href'];
  icon: React.ReactNode;
  label: string;
  cta: string;
  tone: 'primary' | 'amber';
}) {
  return (
    <Link href={href} className={`${styles.quickAction} ${styles[tone]}`}>
      <span className={styles.quickActionIcon} aria-hidden>
        {icon}
      </span>
      <span className={styles.quickActionLabel}>{label}</span>
      {/* 시안의 `button` 인스턴스 — Link 안이라 실제 button 요소는 아니다 */}
      <span className={styles.quickActionCta} aria-hidden>
        {cta}
      </span>
    </Link>
  );
}
