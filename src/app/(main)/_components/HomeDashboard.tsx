'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy, Mail, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import styles from './HomeDashboard.module.scss';

/**
 * 홈 대시보드 (사이트맵 v2)
 *
 * 위젯 (위 → 아래):
 *   1) 위치+날씨 기반 오늘의 추천 (WeatherWidget + 추천 1~3개)
 *   2) 진행 중인 충북 축제 슬라이드 (Carousel + useOngoingFestivals)
 *   3) 빠른 시작 3버튼 (토너먼트/편지/유형 테스트)
 *   4) 새로 도착한 편지 미리보기 (가장 최근 1장 + 도트)
 *   5) 내 우승지 가로 슬라이드 (Carousel + slidesPerView 2~3)
 *
 * 성능 원칙:
 *   - 각 위젯은 자체 useQuery → waterfall 회피
 *   - 무거운 모듈(Carousel, Chart)은 동적 import (이미 features/* 에서 처리)
 *   - 위젯 단위 fixed height → CLS 0
 *   - 첫 페인트 후 위젯들이 streaming 으로 채워짐
 */
export function HomeDashboard() {
  const t = useTranslations('home.widgets');

  return (
    <div className={styles.grid}>
      {/* 1) 위치+날씨 기반 오늘의 추천 */}
      <section data-widget="weather-recommendation">
        {/* TODO: <WeatherWidget />
                  - 좌측: 온도/condition/locationLabel
                  - 우측: 추천 여행지 1~3 */}
        <Placeholder height={120} title={t('weatherRecommendation')} />
      </section>

      {/* 2) 진행 중인 충북 축제 슬라이드 */}
      <section data-widget="ongoing-festivals">
        {/* TODO:
              const { data: festivals } = useOngoingFestivals();
              <Carousel
                slides={festivals ?? []}
                renderSlide={(f) => <FestivalCard festival={f} />}
                keyExtractor={(f) => f.id}
                options={{ loop: true, autoplayMs: 4500 }}
                showDots fallbackHeight={180}
                ariaLabel={t('ongoingFestivals')}
              /> */}
        <Placeholder height={180} title={t('ongoingFestivals')} note="Carousel" />
      </section>

      {/* 3) 빠른 시작 3버튼 */}
      <section data-widget="quick-actions" className={styles.quickActions}>
        <QuickActionLink href={ROUTES.TOURNAMENT} icon={<Trophy size={20} />} label={t('quick.tournament')} />
        <QuickActionLink href={ROUTES.LETTER_COMPOSE} icon={<Mail size={20} />} label={t('quick.letter')} />
        <QuickActionLink href={ROUTES.QUIZ} icon={<Sparkles size={20} />} label={t('quick.quiz')} />
      </section>

      {/* 4) 새로 도착한 편지 미리보기 */}
      <section data-widget="latest-letter">
        {/* TODO: <LatestReceivedLetter />
                  - 가장 최근 1장 원고지 미니 카드 + 도트
                  - 클릭 시 /letter/[id] */}
        <Placeholder height={140} title={t('latestLetter')} />
      </section>

      {/* 5) 내 우승지 가로 슬라이드 */}
      <section data-widget="my-winners">
        {/* TODO:
              const { data: winners } = useSavedTournaments();
              <Carousel
                slides={winners ?? []}
                renderSlide={(w) => <WinnerMiniCard winner={w} />}
                keyExtractor={(w) => w.id}
                options={{ slidesPerView: 2.2, gap: 12, dragFree: true }}
                showDots={false}
              /> */}
        <Placeholder height={140} title={t('myWinners')} note="Carousel" />
      </section>
    </div>
  );
}

function QuickActionLink({
  href,
  icon,
  label,
}: {
  href: string;
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

function Placeholder({
  height,
  title,
  note,
}: {
  height: number;
  title: string;
  note?: string;
}) {
  return (
    <div
      style={{
        height,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        color: 'var(--color-muted)',
        fontSize: '0.875rem',
      }}
    >
      {title}
      {note && (
        <span
          style={{
            padding: '2px 6px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.6875rem',
          }}
        >
          {note}
        </span>
      )}
    </div>
  );
}
