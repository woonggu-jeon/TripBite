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
 * 토너먼트 설정 — 스텝별 진행 (5 steps)
 *
 *   1) 테마 종류    : 계절 / 특별한 날
 *   2) 항목         : (계절) 봄·여름·가을·겨울 / (특별한 날) 생일·결혼기념일
 *   3) 여행 유형    : 지역·축제·관광지·체험관광 (다중) — 세로 4 카드
 *   4) 여행지 갯수  : 2 / 4 / 6 / 8  (N)
 *   5) 토너먼트 개수 : 2 / 4 / 6 / 8  (M ≤ N) — N 이상은 disable
 *
 * 단일 선택 스텝(1·2·4·5)은 선택 즉시 next.
 * 다중 선택 스텝(3)은 "다음" 버튼.
 * 마지막 스텝(5)은 선택 후 "시작하기".
 *
 * 뒤로: step > 1 → step--, step === 1 → router.back()
 */

type Step = 1 | 2 | 3 | 4 | 5;
const TOTAL_STEPS = 5;

export function TournamentSetup() {
  const router = useRouter();
  const t = useTranslations('tournament.setup');
  const setConfig = useTournamentStore((s) => s.setConfig);

  const [step, setStep] = useState<Step>(1);
  const [themeKind, setThemeKind] = useState<ThemeKind | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [specialDay, setSpecialDay] = useState<SpecialDay | null>(null);
  const [categories, setCategories] = useState<DestinationCategory[]>([]);
  const [count, setCount] = useState<TournamentCount | null>(null);
  const [tournamentSize, setTournamentSize] = useState<TournamentCount | null>(
    null,
  );

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

  const handleCount = (c: TournamentCount) => {
    setCount(c);
    // count 변경 시 tournamentSize 가 새 count 보다 크면 reset
    if (tournamentSize !== null && tournamentSize > c) {
      setTournamentSize(null);
    }
    setStep(5);
  };

  const handleTournamentSize = (m: TournamentCount) => {
    setTournamentSize(m);
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
    step === 5 &&
    count !== null &&
    tournamentSize !== null &&
    tournamentSize <= count &&
    resolveTheme() !== null &&
    categories.length > 0;

  const handleStart = () => {
    const theme = resolveTheme();
    if (
      !theme ||
      count === null ||
      tournamentSize === null ||
      categories.length === 0
    )
      return;
    haptic.success();
    setConfig({ theme, categories, count, tournamentSize });
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
    if (step === 4)
      return { title: t('steps.count.title'), hint: t('steps.count.hint') };
    return {
      title: t('steps.tournamentSize.title'),
      hint: t('steps.tournamentSize.hint'),
    };
  })();

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <button
          type="button"
          className={styles.back}
          onClick={goBack}
          aria-label={t('back')}
        >
          ←
        </button>
        <span className={styles.progress}>
          {t('progress', { current: step, total: TOTAL_STEPS })}
        </span>
        <span aria-hidden className={styles.headSpacer} />
      </header>

      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.title}>{heading.title}</h2>
        <p className={styles.hint}>{heading.hint}</p>

        {step === 1 && (
          <ThemeKindSelector value={themeKind} onChange={handleKind} />
        )}
        {step === 2 && themeKind === 'season' && (
          <SeasonSelector value={season} onChange={handleSeason} />
        )}
        {step === 2 && themeKind === 'special' && (
          <SpecialDaySelector value={specialDay} onChange={handleSpecialDay} />
        )}
        {step === 3 && (
          <CategoryFilter values={categories} onChange={setCategories} />
        )}
        {step === 4 && <CountSelector value={count} onChange={handleCount} />}
        {step === 5 && (
          <CountSelector
            value={tournamentSize}
            onChange={handleTournamentSize}
            max={count ?? undefined}
            ariaLabelKey="steps.tournamentSize.title"
          />
        )}
      </div>

      {step === 3 && (
        <button
          type="button"
          className={styles.next}
          onClick={() => setStep(4)}
          disabled={categories.length === 0}
        >
          {t('next')}
        </button>
      )}

      {step === 5 && (
        <button
          type="button"
          className={styles.start}
          onClick={handleStart}
          disabled={!canStart}
        >
          {t('start')}
        </button>
      )}

      {(step === 1 || step === 2 || step === 4) && (
        <p className={styles.autoHint}>{t('selectToContinue')}</p>
      )}
    </div>
  );
}
