'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CenterIllustration } from '@/features/tournament/components/CenterIllustration';
import { FallingPetals } from '@/features/tournament/components/FallingPetals';
import { ChungbukMap } from '@/features/tournament/components/ChungbukMap';
import { Bracket } from '@/features/tournament/components/Bracket';
import type { Destination } from '@/features/tournament/types';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import { useTournamentCandidates } from '@/features/tournament/hooks/use-tournament';
import styles from './TournamentPlayClient.module.scss';

type Phase = 'intro' | 'map' | 'bracket';

const INTRO_MS = 2500;

/**
 * 토너먼트 진행 클라이언트
 *
 *   1) intro  : 중앙 일러스트 + 계절 파티클 (자동 2.5초 → map)
 *   2) map    : 충북 지도 + N 개 시군 자동 꽃잎 (사용자 선택 X). "토너먼트 시작" 클릭 → bracket
 *   3) bracket: N 중 random M(=config.tournamentSize) 개로 1:1 매치업
 *
 * 설정 없이 직접 진입 시 자동 redirect 대신 안내 + 설정 화면 진입 버튼.
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const t = useTranslations('tournament.play');
  const config = useTournamentStore((s) => s.config);
  const setWinner = useTournamentStore((s) => s.setWinner);

  const [phase, setPhase] = useState<Phase>('intro');

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

  // 시군별 dedup → 여행지 갯수(N) 만큼 노출.
  // (백엔드 연동 후엔 handler 가 N개 시군의 destinations 만 반환할 예정)
  // hook 은 항상 같은 순서로 호출되어야 하므로 early return 앞에 배치.
  const N = config?.count ?? 0;
  const M = config?.tournamentSize ?? 0;
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

  // bracket 진입 시 사용할 destinations — dedupedPool 중 앞에서 M개 (pool 이 이미 셔플됨).
  const matchupDestinations = useMemo<Destination[]>(
    () => dedupedPool?.slice(0, M) ?? [],
    [dedupedPool, M],
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

  const handleProceed = () => {
    setPhase('bracket');
  };

  const handleBracketComplete = (winner: Destination) => {
    setWinner(winner);
    router.replace('/tournament/result');
  };

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
              {/* 사용자 선택 X (필수 자동) — selected/onToggle prop 전달 안 함 */}
              <ChungbukMap destinations={dedupedPool} theme={theme} />
              <div className={styles.mapFooter}>
                <p className={styles.counter}>
                  {t('autoSummary', { destinations: N, matchups: M })}
                </p>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={handleProceed}
                >
                  {t('startBracket')}
                </button>
              </div>
            </>
          )}
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
    </div>
  );
}
