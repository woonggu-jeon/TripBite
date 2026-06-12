'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ThemeKindSelector,
  type ThemeKind,
} from '@/features/tournament/components/ThemeKindSelector';
import { SeasonSelector } from '@/features/tournament/components/SeasonSelector';
import { CategoryFilter } from '@/features/tournament/components/CategoryFilter';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { SubHeader } from '@/components/layout/SubHeader';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import type { DestinationCategory, Season } from '@/api/generated/schemas';
import type {
  TournamentCount,
  TournamentTheme,
} from '@/features/tournament/types';
import { haptic } from '@/lib/haptic';
import { Button } from '@/components/ui';
import styles from './TournamentSetup.module.scss';

/**
 * 토너먼트 설정 — 스텝별 진행 (4 steps)
 *
 *   1) 테마 종류    : 계절 직접선택 / 랜덤테마
 *   2) 계절         : 봄·여름·가을·겨울 (1 step 에서 'season' 선택 시만)
 *   3) 여행 유형    : 지역·축제·관광지·체험관광 (단일)
 *   4) 여행지 갯수  : 2 / 4 / 6 / 8
 *
 * 흐름:
 *   - season  : step 1 → 2 (계절) → 3 (유형) → 4 (갯수)
 *   - random  : step 1 → (계절/유형 즉시 랜덤 선택) → 4 (갯수) 로 점프
 *
 * 모든 step (1/2/3)은 선택 즉시 next. step 4 만 "시작하기" 버튼.
 * 토너먼트 매치업 사이즈(M ≤ N)는 Play 페이지의 별도 phase 에서 결정.
 *
 * 홈 → /tournament?theme=season&season=spring 으로 진입 시 1·2 단계 자동
 * prefill, step 3 (유형) 부터 시작.
 *
 * 뒤로: step > 1 → step--, step === 1 → router.back()
 */

type Step = 1 | 2 | 3 | 4;

const VALID_SEASONS: readonly Season[] = [
  'spring',
  'summer',
  'autumn',
  'winter',
];

const CATEGORIES: readonly DestinationCategory[] = [
  'festival',
  'attraction',
  'experience',
];

function pickRandom<T>(arr: readonly T[]): T {
  // 빈 배열은 호출자가 보장 — 본 함수는 비-undefined 단언.
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function TournamentSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('tournament.setup');
  const tSeason = useTranslations('tournament.season');
  const setConfig = useTournamentStore((s) => s.setConfig);

  // 홈 "이번 {계절} 토너먼트 시작하기" 진입 시 query 로 theme + season 사전 선택.
  // theme=season&season=spring → themeKind/season 채우고 step 3 (여행 유형) 부터.
  const initialTheme = searchParams.get('theme');
  const initialSeasonParam = searchParams.get('season');
  const initialSeason: Season | null =
    initialTheme === 'season' &&
    initialSeasonParam !== null &&
    (VALID_SEASONS as readonly string[]).includes(initialSeasonParam)
      ? (initialSeasonParam as Season)
      : null;
  const initialThemeKind: ThemeKind | null = initialSeason ? 'season' : null;
  const initialStep: Step = initialThemeKind ? 3 : 1;

  const [step, setStep] = useState<Step>(initialStep);
  const [themeKind, setThemeKind] = useState<ThemeKind | null>(
    initialThemeKind,
  );
  const [season, setSeason] = useState<Season | null>(initialSeason);
  const [category, setCategory] = useState<DestinationCategory | null>(null);
  const [count, setCount] = useState<TournamentCount | null>(null);

  // step 전환 시 이전 step 의 클릭된 button focus 가 unmount 되며 브라우저가
  // fallback 으로 새 step 의 동일 위치 button 에 focus 자동 이동시키는 케이스.
  // 명시 blur 로 차단 — 새 step 첫 진입 시 어느 카드에도 focus 안 남음.
  const advanceTo = (next: Step) => {
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    setStep(next);
  };

  const handleKind = (k: ThemeKind) => {
    setThemeKind(k);
    if (k === 'season') {
      advanceTo(2);
      return;
    }
    // random 테마 — 계절 + 카테고리 즉시 랜덤 채우고 바로 갯수 step 으로.
    const randomSeason = pickRandom(VALID_SEASONS);
    const randomCategory = pickRandom(CATEGORIES);
    setSeason(randomSeason);
    setCategory(randomCategory);
    advanceTo(4);
  };

  const handleSeason = (s: Season) => {
    setSeason(s);
    advanceTo(3);
  };

  const handleCategory = (c: DestinationCategory) => {
    setCategory(c);
    advanceTo(4);
  };

  const handleCount = (c: TournamentCount) => {
    setCount(c);
  };

  const goBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    // random 흐름 (themeKind === 'random') 에서 step 4 인 경우 → 1 로 복귀.
    // (계절/유형이 자동 선택이라 step 2/3 으로 돌아갈 의미 X)
    if (themeKind === 'random' && step === 4) {
      setStep(1);
      return;
    }
    setStep((step - 1) as Step);
  };

  const canStart =
    step === 4 && count !== null && season !== null && category !== null;

  const handleStart = () => {
    if (count === null || season === null || category === null) return;
    haptic.success();
    // random 흐름이라도 store 에는 동일 형태 — kind='season' + 랜덤 선택된 value.
    const theme: TournamentTheme = { kind: 'season', value: season };
    setConfig({ theme, categories: [category], count });
    router.push('/tournament/play');
  };

  const heading = (() => {
    if (step === 1)
      return {
        title: t('steps.themeKind.title'),
        hint: t('steps.themeKind.hint'),
      };
    if (step === 2)
      return { title: t('steps.season.title'), hint: t('steps.season.hint') };
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
          {step === 2 && (
            <SeasonSelector value={season} onChange={handleSeason} />
          )}
          {step === 3 && (
            <>
              <CategoryFilter value={category} onChange={handleCategory} />
              {/*
                BE 동작 고지 — 계절 필터는 'festival' 에만 적용 (eventStart 월 기반).
                attraction/experience/local 선택 시 BE 가 계절 무관 응답 → 사용자가
                "왜 겨울 아닌 게?" 혼란 막기 위해 결정적 시점 (카테고리 선택 후) 에 안내.
              */}
              {category && category !== 'festival' && season && (
                <p className={styles.scopeHint} role="status">
                  {t('steps.category.seasonScopeNonFestival', {
                    season: tSeason(season),
                  })}
                </p>
              )}
            </>
          )}
          {step === 4 && (
            <>
              <CountSelector
                value={count}
                onChange={handleCount}
                mode="destination"
              />
              {/*
                계절 적용 범위 hint — 비-festival + 계절 선택된 상태일 때.
                step 3 에서 카테고리 선택 즉시 step 4 로 advance 되므로, 사용자가
                실제로 hint 를 인지하는 시점은 여기 (시작 전 마지막 화면).
              */}
              {category && category !== 'festival' && season && (
                <p className={styles.scopeHint} role="status">
                  {t('steps.category.seasonScopeNonFestival', {
                    season: tSeason(season),
                  })}
                </p>
              )}
            </>
          )}
        </div>

        {step === 4 && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleStart}
            disabled={!canStart}
          >
            {t('start')}
          </Button>
        )}

        {(step === 1 || step === 2 || step === 3) && (
          <p className={styles.autoHint}>{t('selectToContinue')}</p>
        )}
      </div>
    </>
  );
}
