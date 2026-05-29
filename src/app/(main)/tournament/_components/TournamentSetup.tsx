'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ThemeKindSelector,
  type ThemeKind,
} from '@/features/tournament/components/ThemeKindSelector';
import { SeasonSelector } from '@/features/tournament/components/SeasonSelector';
import { SpecialDaySelector } from '@/features/tournament/components/SpecialDaySelector';
import { CategoryFilter } from '@/features/tournament/components/CategoryFilter';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { SubHeader } from '@/components/layout/SubHeader';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import type {
  DestinationCategory,
  Season,
  SpecialDay,
  TournamentCount,
  TournamentTheme,
} from '@/features/tournament/types';
import { haptic } from '@/lib/haptic';
import styles from './TournamentSetup.module.scss';

/**
 * 토너먼트 설정 — 스텝별 진행 (4 steps)
 *
 *   1) 테마 종류    : 계절 / 특별한 날
 *   2) 항목         : (계절) 봄·여름·가을·겨울 / (특별한 날) 생일·결혼기념일
 *   3) 여행 유형    : 지역·축제·관광지·체험관광 (단일) — 세로 4 카드, 선택 즉시 다음
 *   4) 여행지 갯수  : 2 / 4 / 6 / 8  (N)
 *
 * 모든 스텝(1·2·3)은 선택 즉시 next.
 * 마지막 스텝(4)은 선택 후 "시작하기" — /tournament/play 로 이동.
 *
 * 토너먼트 개수(M ≤ N)는 Play 페이지의 별도 phase 에서 결정.
 *
 * store.config.categories 는 백엔드 호환을 위해 배열 유지 — UI 는 단일 선택이지만
 * `[category]` 한 원소 배열로 저장.
 *
 * 뒤로: step > 1 → step--, step === 1 → router.back()
 */

type Step = 1 | 2 | 3 | 4;

export function TournamentSetup() {
  const router = useRouter();
  const t = useTranslations('tournament.setup');
  const setConfig = useTournamentStore((s) => s.setConfig);

  const [step, setStep] = useState<Step>(1);
  const [themeKind, setThemeKind] = useState<ThemeKind | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [specialDay, setSpecialDay] = useState<SpecialDay | null>(null);
  const [category, setCategory] = useState<DestinationCategory | null>(null);
  const [count, setCount] = useState<TournamentCount | null>(null);

  const handleKind = (k: ThemeKind) => {
    setThemeKind(k);
    // 분기 바뀌면 다른 분기 선택 초기화
    if (k === 'season') setSpecialDay(null);
    else setSeason(null);
    setStep(2);
  };

  const handleSeason = (s: Season) => {
    setSeason(s);
    setStep(3);
  };

  const handleSpecialDay = (d: SpecialDay) => {
    setSpecialDay(d);
    setStep(3);
  };

  const handleCategory = (c: DestinationCategory) => {
    setCategory(c);
    setStep(4);
  };

  const handleCount = (c: TournamentCount) => {
    setCount(c);
  };

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((step - 1) as Step);
  };

  const resolveTheme = (): TournamentTheme | null => {
    if (themeKind === 'season' && season !== null) {
      return { kind: 'season', value: season };
    }
    if (themeKind === 'special' && specialDay !== null) {
      return { kind: 'special', value: specialDay };
    }
    return null;
  };

  const canStart =
    step === 4 &&
    count !== null &&
    resolveTheme() !== null &&
    category !== null;

  const handleStart = () => {
    const theme = resolveTheme();
    if (!theme || count === null || category === null) return;
    haptic.success();
    // store 호환: categories 는 배열 — 단일 선택이지만 [category] 로 저장
    setConfig({ theme, categories: [category], count });
    router.push('/tournament/play');
  };

  const heading = (() => {
    if (step === 1)
      return {
        title: t('steps.themeKind.title'),
        hint: t('steps.themeKind.hint'),
      };
    if (step === 2) {
      return themeKind === 'season'
        ? { title: t('steps.season.title'), hint: t('steps.season.hint') }
        : { title: t('steps.special.title'), hint: t('steps.special.hint') };
    }
    if (step === 3)
      return {
        title: t('steps.category.title'),
        hint: t('steps.category.hint'),
      };
    return { title: t('steps.count.title'), hint: t('steps.count.hint') };
  })();

  return (
    <>
      <SubHeader title={heading.title} onBack={goBack} />
      <div className={styles.wrap}>
        <div className={styles.section}>
          <p className={styles.hint}>{heading.hint}</p>

          {step === 1 && (
            <ThemeKindSelector value={themeKind} onChange={handleKind} />
          )}
          {step === 2 && themeKind === 'season' && (
            <SeasonSelector value={season} onChange={handleSeason} />
          )}
          {step === 2 && themeKind === 'special' && (
            <SpecialDaySelector
              value={specialDay}
              onChange={handleSpecialDay}
            />
          )}
          {step === 3 && (
            <CategoryFilter value={category} onChange={handleCategory} />
          )}
          {step === 4 && (
            <CountSelector
              value={count}
              onChange={handleCount}
              mode="destination"
            />
          )}
        </div>

        {step === 4 && (
          <button
            type="button"
            className={styles.start}
            onClick={handleStart}
            disabled={!canStart}
          >
            {t('start')}
          </button>
        )}

        {(step === 1 || step === 2 || step === 3) && (
          <p className={styles.autoHint}>{t('selectToContinue')}</p>
        )}
      </div>
    </>
  );
}
