'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CenterIllustration } from '@/features/tournament/components/CenterIllustration';
import { FallingPetals } from '@/features/tournament/components/FallingPetals';
import { ChungbukMap } from '@/features/tournament/components/ChungbukMap';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { Bracket } from '@/features/tournament/components/Bracket';
import type { Destination, TournamentCount } from '@/features/tournament/types';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import { useTournamentCandidates } from '@/features/tournament/hooks/use-tournament';
import styles from './TournamentPlayClient.module.scss';

type Phase = 'intro' | 'map' | 'tournamentSize' | 'bracket' | 'celebration';

const INTRO_MS = 2500;
const CELEBRATION_MS = 1800;

/**
 * 토너먼트 진행 클라이언트
 *
 *   1) intro          : 중앙 일러스트 + 계절 파티클 (자동 2.5초 → map)
 *   2) map            : 충북 지도 + N 개 시군 자동 꽃잎 → "다음" 클릭 → tournamentSize
 *   3) tournamentSize : 토너먼트 수 M 선택 (M ≤ N) → store.setTournamentSize → bracket
 *   4) bracket        : N 중 앞에서 M 개로 1:1 매치업 (pool 이 이미 셔플돼있음)
 *
 * 설정 없이 직접 진입 시 자동 redirect 대신 안내 + 설정 화면 진입 버튼.
 *
 * 사용자 요구:
 *   - 토너먼트 데이터(여행유형 + 여행지 + 토너먼트 수)는 API 호출 파라미터로 전달
 *   - tournamentSize 는 Play 의 별도 phase 에서 결정 (Setup 에서는 결정 X)
 *   - 지도 꽃잎은 자동(선택 X 필수)
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const t = useTranslations('tournament.play');
  const config = useTournamentStore((s) => s.config);
  const setTournamentSize = useTournamentStore((s) => s.setTournamentSize);
  const setWinner = useTournamentStore((s) => s.setWinner);

  const [phase, setPhase] = useState<Phase>('intro');
  const [pendingSize, setPendingSize] = useState<TournamentCount | null>(null);
  const [pendingWinner, setPendingWinner] = useState<Destination | null>(null);

  const {
    data: pool,
    isLoading,
    isError,
    refetch,
  } = useTournamentCandidates(config);

  // intro 자동 진행 (config 있을 때만)
  useEffect(() => {
    if (!config || phase !== 'intro') return;
    const id = window.setTimeout(() => setPhase('map'), INTRO_MS);
    return () => window.clearTimeout(id);
  }, [config, phase]);

  // celebration → result 자동 이동
  useEffect(() => {
    if (phase !== 'celebration' || !pendingWinner) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 400 : CELEBRATION_MS;
    const id = window.setTimeout(() => {
      setWinner(pendingWinner);
      router.replace('/tournament/result');
    }, delay);
    return () => window.clearTimeout(id);
  }, [phase, pendingWinner, setWinner, router]);

  // 시군별 dedup → 여행지 갯수(N) 만큼 노출.
  // hook 은 항상 같은 순서로 호출되어야 하므로 early return 앞에 배치.
  const N = config?.count ?? 0;
  const dedupedPool = useMemo<Destination[] | null>(() => {
    if (!pool) return null;
    const seen = new Set<string>();
    const dedup: Destination[] = [];
    for (const d of pool) {
      if (seen.has(d.region)) continue;
      seen.add(d.region);
      dedup.push(d);
      if (dedup.length >= N) break;
    }
    return dedup;
  }, [pool, N]);

  // bracket 진입 시 pool 앞 M 개 사용 (pool 이 이미 셔플됨, dedup X — 시군 중복 허용)
  // 사용자가 32강 선택 시 32 destinations 필요 — dedupedPool(시군 dedup) 은 11개 한계라 X.
  const matchupSize = config?.tournamentSize ?? pendingSize ?? 0;
  const matchupDestinations = useMemo<Destination[]>(
    () => pool?.slice(0, matchupSize) ?? [],
    [pool, matchupSize],
  );

  if (!config) {
    return (
      <div className={styles.empty}>
        <p>{t('noConfig')}</p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => router.replace('/tournament')}
        >
          {t('goSetup')}
        </button>
      </div>
    );
  }

  const theme = config.theme;

  const handleMapNext = () => {
    setPhase('tournamentSize');
  };

  const handleStartBracket = () => {
    if (!pendingSize) return;
    setTournamentSize(pendingSize); // store.config.tournamentSize 갱신 (API 호출용)
    setPhase('bracket');
  };

  const handleBracketComplete = (winner: Destination) => {
    // 즉시 result 이동 X — celebration phase 에서 1.8s 우승자 강조 후 자동 이동.
    setPendingWinner(winner);
    setPhase('celebration');
  };

  // 여행지 수(N)와 토너먼트 수(M)는 독립. 매치업 destinations 은 풀에서 random M개.
  const canStartBracket = pendingSize !== null;

  return (
    <div className={styles.wrap}>
      {theme.kind === 'season' && phase !== 'bracket' && (
        <FallingPetals season={theme.value} active />
      )}

      {phase === 'intro' && (
        <div className={styles.center}>
          <CenterIllustration theme={theme} onTap={() => {}} disabled />
          <p className={styles.hint}>
            {isLoading ? t('loading') : isError ? t('error') : t('introHint')}
          </p>
          {isError && (
            <button
              type="button"
              className={styles.retry}
              onClick={() => refetch()}
            >
              {t('retry')}
            </button>
          )}
        </div>
      )}

      {phase === 'map' && (
        <div className={styles.map}>
          {!dedupedPool && isLoading && (
            <p className={styles.hint}>{t('loading')}</p>
          )}
          {!dedupedPool && isError && (
            <div className={styles.errorBox}>
              <p>{t('error')}</p>
              <button
                type="button"
                className={styles.retry}
                onClick={() => refetch()}
              >
                {t('retry')}
              </button>
            </div>
          )}
          {dedupedPool && (
            <>
              {/* 자동 표시 — 사용자 선택 X (selected/onToggle 미전달) */}
              <ChungbukMap destinations={dedupedPool} theme={theme} />
              <div className={styles.mapFooter}>
                <p className={styles.counter}>
                  {t('mapSummary', { destinations: N })}
                </p>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={handleMapNext}
                >
                  {t('next')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'tournamentSize' && (
        <div className={styles.sizePhase}>
          <h2 className={styles.sizeTitle}>{t('tournamentSize.title')}</h2>
          <p className={styles.sizeHint}>{t('tournamentSize.hint')}</p>
          <CountSelector
            value={pendingSize}
            onChange={setPendingSize}
            mode="tournament"
          />
          <button
            type="button"
            className={styles.cta}
            disabled={!canStartBracket}
            onClick={handleStartBracket}
          >
            {t('startBracket')}
          </button>
        </div>
      )}

      {phase === 'bracket' && (
        <div className={styles.bracket}>
          <Bracket
            destinations={matchupDestinations}
            onComplete={handleBracketComplete}
          />
        </div>
      )}

      {phase === 'celebration' && pendingWinner && (
        <div className={styles.celebration} role="status" aria-live="polite">
          <div className={styles.celebGlow} aria-hidden />
          <div className={styles.celebTrophy} aria-hidden>
            🏆
          </div>
          <p className={styles.celebTitle}>{t('celebration.title')}</p>
          <p className={styles.celebName}>{pendingWinner.name}</p>
          <p className={styles.celebRegion}>{pendingWinner.region}</p>
          <span className={styles.celebSparkle1} aria-hidden>
            ✦
          </span>
          <span className={styles.celebSparkle2} aria-hidden>
            ✦
          </span>
          <span className={styles.celebSparkle3} aria-hidden>
            ✧
          </span>
        </div>
      )}
    </div>
  );
}
