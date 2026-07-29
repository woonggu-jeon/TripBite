'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type {
  DestinationCategory,
  RegionCode,
  Season,
} from '@/api/generated/schemas';
import { SubHeader } from '@/components/layout/SubHeader';
import { Button, ButtonGrid } from '@/components/ui';
import { SeasonIcon } from '@/components/ui/SeasonIcon';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { CategoryFilter } from '@/features/tournament/components/CategoryFilter';
import { ChungbukMap } from '@/features/tournament/components/ChungbukMap';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { FallingPetals } from '@/features/tournament/components/FallingPetals';
import { SeasonSelector } from '@/features/tournament/components/SeasonSelector';
import {
  type ThemeKind,
  ThemeKindSelector,
} from '@/features/tournament/components/ThemeKindSelector';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import type {
  TournamentCount,
  TournamentTheme,
} from '@/features/tournament/types';
import { haptic } from '@/lib/haptic';
import styles from './TournamentSetup.module.scss';

/**
 * 토너먼트 설정 — Figma TRN 전체 setup flow (2026-06-24 refactor).
 *
 * 흐름 (7 step):
 *   1) themeKind        : 계절/랜덤 (Figma T-1)
 *   2) season           : 봄/여름/가을/겨울 (Figma T-2, themeKind=season 일 때만)
 *   3) category         : 축제/관광지/체험관광 (Figma T-3)
 *   4) count            : 여행지 갯수 2/4/6/8 (Figma T-4) — store.setConfig 시점
 *   5) intro            : 로딩 (Figma T-5, 2.5s 자동 → step 6)
 *   6) map              : 시군 N random pick + ChungbukMap (Figma T-5 여행지 준비완료)
 *   7) tournamentSize   : 4/8/16/32 (Figma T-6) — store.setTournamentSize + push /play
 *
 * 흐름 분기:
 *   - season  : 1 → 2 → 3 → 4 → 5 → 6 → 7 → /play
 *   - random  : 1 → ("다음" click 시 season/category 즉시 랜덤) → 4 → 5 → 6 → 7 → /play
 *
 * fetch 시점은 변경 X — useTournamentCandidates 는 /tournament/play 진입 후 호출.
 * (사용자가 setup 도중 이탈 시 헛 fetch 회피 + cancellation 단순.)
 *
 * 홈 → /tournament?theme=season&season=spring 진입 시 1·2 prefill, step 3 부터 시작.
 *
 * 뒤로:
 *   - step 6/7: 6 → 4 (intro skip), 7 → 6
 *   - step 4 (random): → 1 (계절/유형 자동 선택이라 step 2/3 의미 X)
 *   - step > 1: → step - 1
 *   - step === 1: router.back()
 */

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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

// intro phase 자동 advance 시간 — 사용자 피드백 (2026-06-24) "굳이 시간이
// 오래 걸릴 이유가 있나" → 2.5s → 1.0s. fetch 시점이 아닌 단순 시각 transition
// 이므로 안내 카피 한 번 읽을 시간만 두고 빠르게 map 으로.
const INTRO_MS = 1000;

// zustand selector 의 fallback array — module-level stable reference 로 두지
// 않으면 `?? []` 가 매 render 마다 새 배열 → selector 가 변경 감지 → 무한
// re-render (React DevTools "Maximum update depth" warning).
const EMPTY_REGIONS: readonly string[] = Object.freeze([]);

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickRandomRegions(count: number): string[] {
  const codes = CHUNGBUK_REGIONS.map((r) => r.code).slice();
  for (let i = codes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ci = codes[i];
    const cj = codes[j];
    if (ci !== undefined && cj !== undefined) {
      codes[i] = cj;
      codes[j] = ci;
    }
  }
  return codes.slice(0, Math.min(count, codes.length));
}

export function TournamentSetup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('tournament.setup');
  const tPlay = useTranslations('tournament.play');
  const tSeason = useTranslations('tournament.season');
  const tNav = useTranslations('tournament');
  const setConfig = useTournamentStore((s) => s.setConfig);
  const setSelectedRegions = useTournamentStore((s) => s.setSelectedRegions);
  const setTournamentSize = useTournamentStore((s) => s.setTournamentSize);
  const reset = useTournamentStore((s) => s.reset);
  const selectedRegions = useTournamentStore(
    (s) => s.config?.selectedRegions ?? EMPTY_REGIONS,
  );

  // mount 1회 — 직전 토너먼트 store 잔재 (config/selectedRegions/tournamentSize/
  // winner 등) 정리. 사용자가 result → "다시하기" → /tournament 재진입 시 잔재
  // 가 false-positive 진입 가드로 /play 직진 가능 — 명시 reset 으로 차단.
  //
  // 동시에 /tournament/play chunk prefetch — 사용자가 step 7 "토너먼트 시작"
  // click 시점에 이미 background download 완료 → push 즉시 mount, 페이지 점프
  // 시각적 어색함 회피 (사용자 피드백 2026-06-24).
  useEffect(() => {
    reset();
    router.prefetch('/tournament/play');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [pendingSize, setPendingSize] = useState<TournamentCount | null>(null);

  const advanceTo = (next: Step) => {
    if (typeof document !== 'undefined') {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    setStep(next);
  };

  // step 5 (intro) 자동 advance — 2.5s 후 step 6 (map).
  useEffect(() => {
    if (step !== 5) return;
    const id = window.setTimeout(() => advanceTo(6), INTRO_MS);
    return () => window.clearTimeout(id);
  }, [step]);

  // step 6 (map) 진입 시 N 시군 random pick — store.setSelectedRegions.
  // 이미 있으면 그대로 (reshuffle 만 별도 트리거).
  useEffect(() => {
    if (step !== 6 || count === null) return;
    if (selectedRegions.length > 0) return;
    setSelectedRegions(pickRandomRegions(count));
  }, [step, count, selectedRegions.length, setSelectedRegions]);

  const handleKind = (k: ThemeKind) => setThemeKind(k);
  const handleSeason = (s: Season) => setSeason(s);
  const handleCategory = (c: DestinationCategory) => setCategory(c);
  const handleCount = (c: TournamentCount) => setCount(c);

  // step 4 → 5 전환 시 store.setConfig 실행 — selectedRegions 는 step 6 에서 set.
  const persistSetupConfig = (
    c: TournamentCount,
    s: Season,
    cat: DestinationCategory,
  ) => {
    const theme: TournamentTheme = { kind: 'season', value: s };
    setConfig({ theme, categories: [cat], count: c });
  };

  const handleNext = () => {
    if (step === 1) {
      if (themeKind === 'season') {
        advanceTo(2);
        return;
      }
      // random — season/category 즉시 랜덤 채우고 count step 으로.
      setSeason(pickRandom(VALID_SEASONS));
      setCategory(pickRandom(CATEGORIES));
      advanceTo(4);
      return;
    }
    if (step === 2) return advanceTo(3);
    if (step === 3) return advanceTo(4);
    if (step === 4) {
      if (count === null || season === null || category === null) return;
      haptic.success();
      persistSetupConfig(count, season, category);
      advanceTo(5);
      return;
    }
    // step 5 는 auto-advance, button X. step 6 → 7.
    if (step === 6) return advanceTo(7);
    // step 7 → push /play.
    if (pendingSize === null) return;
    haptic.success();
    setTournamentSize(pendingSize);
    router.push('/tournament/play');
  };

  const handleReshuffle = () => {
    if (count === null) return;
    setSelectedRegions(pickRandomRegions(count));
  };

  const goBack = () => {
    if (step === 1) return router.back();
    if (themeKind === 'random' && step === 4) return setStep(1);
    if (step === 6) return setStep(4); // intro (2.5s auto) skip
    setStep((step - 1) as Step);
  };

  const canAdvance = (() => {
    if (step === 1) return themeKind !== null;
    if (step === 2) return season !== null;
    if (step === 3) return category !== null;
    if (step === 4) return count !== null;
    if (step === 5) return false; // auto
    if (step === 6) return selectedRegions.length > 0;
    return pendingSize !== null;
  })();

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
        title: t('steps.category.title', {
          season: season ? tSeason(season) : '',
        }),
        hint: t('steps.category.hint'),
      };
    if (step === 4)
      return { title: t('steps.count.title'), hint: t('steps.count.hint') };
    // step 6/7 의 heading 은 phase 별 본문이 자체 title 가짐 → 비움.
    return { title: '', hint: '' };
  })();

  const showHeading = step <= 4;

  // step 6 (map) 의 placeholder destinations — ChungbukMap 표식용.
  const mapPlaceholders =
    step === 6 && selectedRegions.length > 0 && category
      ? selectedRegions.map((code) => {
          const region = CHUNGBUK_REGIONS.find((r) => r.code === code);
          const safeCode = (region?.code ?? 'cheongju') as RegionCode;
          return {
            id: `placeholder-${safeCode}`,
            name: region?.ko ?? safeCode,
            category,
            region: safeCode,
          };
        })
      : [];

  return (
    <>
      <SubHeader title={tNav('title')} onBack={goBack} />
      {/* FallingPetals — intro (5) + map (6) 에서만 노출. theme.season prefill 필수 */}
      {season && (step === 5 || step === 6) && (
        <FallingPetals season={season} active />
      )}
      <div className={styles.wrap}>
        {showHeading && (
          <header className={styles.heading}>
            <h2 className={styles.headingTitle}>{heading.title}</h2>
            <p className={styles.hint}>{heading.hint}</p>
          </header>
        )}

        <div className={styles.section}>
          {step === 1 && (
            <ThemeKindSelector value={themeKind} onChange={handleKind} />
          )}
          {step === 2 && (
            <SeasonSelector value={season} onChange={handleSeason} />
          )}
          {step === 3 && (
            <>
              <CategoryFilter value={category} onChange={handleCategory} />
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
              {category && category !== 'festival' && season && (
                <p className={styles.scopeHint} role="status">
                  {t('steps.category.seasonScopeNonFestival', {
                    season: tSeason(season),
                  })}
                </p>
              )}
            </>
          )}

          {/* step 5 — intro: 로딩 (FallingPetals + circle-stack + dots + 안내) */}
          {step === 5 && (
            <div
              className={styles.intro}
              data-season={season ?? 'autumn'}
              aria-hidden
            >
              {/* Figma "TRN · 로딩 (지도 펼침)" (2026-06-25) — 6개 bgLeaf
                  PNG (28×28) + center circle-stack (134 outer 색 + 100 white
                  + 64 wrapper + 52 image). emoji → SeasonIcon PNG 교체. */}
              {season && (
                <>
                  <SeasonIcon
                    season={season}
                    size={36}
                    className={styles.bgLeaf1}
                  />
                  <SeasonIcon
                    season={season}
                    size={36}
                    className={styles.bgLeaf2}
                  />
                  <SeasonIcon
                    season={season}
                    size={36}
                    className={styles.bgLeaf3}
                  />
                  <SeasonIcon
                    season={season}
                    size={36}
                    className={styles.bgLeaf4}
                  />
                  <SeasonIcon
                    season={season}
                    size={36}
                    className={styles.bgLeaf5}
                  />
                  <SeasonIcon
                    season={season}
                    size={36}
                    className={styles.bgLeaf6}
                  />
                </>
              )}
              <div className={styles.circleStack}>
                <span className={styles.circleAmber} />
                <span className={styles.circleWhite} />
                {season && (
                  <SeasonIcon
                    season={season}
                    size={64}
                    className={styles.circleLeaf}
                  />
                )}
              </div>
              <h2 className={styles.introTitle}>{tPlay('introHint')}</h2>
              <div className={styles.dots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}

          {/* step 6 — map: ChungbukMap + "여행지 N곳 선정". 버튼은 .cta 안에서
              2 button (다시하기/다음으로) 분기 — 다른 phase 들과 위치 정합. */}
          {step === 6 && mapPlaceholders.length > 0 && (
            <div className={styles.map}>
              <div className={styles.mapCard}>
                <ChungbukMap
                  destinations={mapPlaceholders}
                  theme={{ kind: 'season', value: season as Season }}
                />
              </div>
              <div className={styles.mapFooter}>
                <h2 className={styles.mapTitle}>
                  {tPlay('mapReady.title', { count: count ?? 0 })}
                </h2>
                <p className={styles.mapDesc}>
                  {tPlay('mapReady.desc', {
                    season: season ? tSeason(season) : '',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* step 7 — tournamentSize: "몇 강의 토너먼트?" + 2×2 size grid */}
          {step === 7 && (
            <div className={styles.sizePhase}>
              <header className={styles.sizeHeading}>
                <h2 className={styles.sizeTitle}>
                  {tPlay('tournamentSize.title')}
                </h2>
                <p className={styles.sizeHint}>
                  {tPlay('tournamentSize.hint')}
                </p>
              </header>
              <CountSelector
                value={pendingSize}
                onChange={setPendingSize}
                mode="tournament"
              />
            </div>
          )}
        </div>

        {/* fixed bottom CTA — step 5 (intro auto) 만 제외.
            step 6 (map) 은 다시하기 + 다음으로 2 button row, 그 외는 1 button. */}
        {step !== 5 && (
          <div className={styles.cta}>
            {step === 6 ? (
              <ButtonGrid className={styles.ctaPair}>
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleReshuffle}
                >
                  {tPlay('reshuffle')}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleNext}
                >
                  {tPlay('start')}
                </Button>
              </ButtonGrid>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleNext}
                disabled={!canAdvance}
              >
                {step === 7 ? tPlay('startBracket') : t('next')}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
