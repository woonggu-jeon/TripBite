'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CenterIllustration } from '@/features/tournament/components/CenterIllustration';
import { FallingPetals } from '@/features/tournament/components/FallingPetals';
import { ChungbukMap } from '@/features/tournament/components/ChungbukMap';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { Bracket } from '@/features/tournament/components/Bracket';
import type {
  BracketResult,
  Destination,
  TournamentCount,
} from '@/features/tournament/types';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  useRecordTournament,
  useTournamentCandidates,
} from '@/features/tournament/hooks/use-tournament';
import { Button } from '@/components/ui';
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
 *
 * ─────────────────────────────────────────────────────────────
 * [FUTURE: BE(NestJS) 연동 시 처리 포인트]
 *
 * 현재 토너먼트는 100% 클라이언트 상태:
 *   - config 만 useTournamentCandidates(config) 로 후보 N개 fetch
 *   - 매치 결과(setBracketResult), 우승자(setWinner) 모두 store-only
 *   - reload 하면 모든 진행 상태가 사라짐
 *
 * BE 연동 시:
 *   1) Play 진입 → `POST /tournaments` (config 전송) → tournamentId 반환
 *      → tournamentId 를 URL `?tid=` 또는 store 에 보관
 *   2) 각 match 종료마다 `PATCH /tournaments/:tid/matches`
 *      또는 마지막에 한 번 `PATCH /tournaments/:tid/complete { bracketResult }`
 *      (네트워크 비용/UX 트레이드오프 — 후자 추천)
 *   3) celebration 단계 후 `router.replace('/tournament/result?tid={id}')`
 *      → 결과 페이지가 deep-link 진입을 지원하게 됨 (위 결과 페이지 메모 참조)
 *
 * 정책 [[rendering-speed-first]]: bracket 진행 중에는 추가 fetch 금지 —
 *   서버 동기화는 fire-and-forget 으로, UI 는 store 기준으로 즉시 진행.
 *   (네트워크 실패 시 토너먼트 완주 자체를 막지 않음. retry queue 권장.)
 * ─────────────────────────────────────────────────────────────
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const t = useTranslations('tournament.play');
  const config = useTournamentStore((s) => s.config);
  const setTournamentSize = useTournamentStore((s) => s.setTournamentSize);
  const setBracketResult = useTournamentStore((s) => s.setBracketResult);
  const record_ = useRecordTournament();

  const [phase, setPhase] = useState<Phase>('intro');
  const [pendingSize, setPendingSize] = useState<TournamentCount | null>(null);
  const [pendingResult, setPendingResult] = useState<BracketResult | null>(
    null,
  );
  const pendingWinner = pendingResult?.winner ?? null;

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

  // celebration → result 자동 이동.
  // - bracket 종료 → record mutation (fire-and-forget) → record.id 받아 ?id= 로 전달.
  //   실패해도 store 만으로 result 페이지 동작 가능 — silent fail.
  useEffect(() => {
    if (phase !== 'celebration' || !pendingResult) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 400 : CELEBRATION_MS;
    const id = window.setTimeout(async () => {
      setBracketResult(pendingResult);
      // POST /tournaments — record id 받아 deep-link 가능하게 URL 에 박음.
      // 실패 시 id 없이 그냥 store-only result 페이지 이동.
      let recordId: string | undefined;
      try {
        const record = await record_.mutateAsync({
          winnerId: pendingResult.winner.id,
          runnerUpId: pendingResult.runnerUp?.id ?? null,
          matchesPlayed: pendingResult.matchesPlayed,
          tournamentSize: config?.tournamentSize ?? matchupSize,
        });
        recordId = record.id;
      } catch {
        /* silent — store 만으로 result 진입 */
      }
      router.replace(
        recordId
          ? `/tournament/result?id=${encodeURIComponent(recordId)}`
          : '/tournament/result',
      );
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pendingResult, setBracketResult, router]);

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
        <Button variant="primary" onClick={() => router.replace('/tournament')}>
          {t('goSetup')}
        </Button>
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

  const handleBracketComplete = (result: BracketResult) => {
    // 즉시 result 이동 X — celebration phase 에서 1.8s 우승자 강조 후 자동 이동.
    setPendingResult(result);
    setPhase('celebration');
  };

  // 여행지 수(N)와 토너먼트 수(M)는 독립. 매치업 destinations 은 풀에서 random M개.
  const canStartBracket = pendingSize !== null;

  return (
    <div className={styles.wrap}>
      {theme.kind === 'season' && (phase === 'intro' || phase === 'map') && (
        <FallingPetals season={theme.value} active />
      )}

      {phase === 'intro' && (
        <div className={styles.center}>
          <CenterIllustration theme={theme} onTap={() => {}} disabled />
          <p className={styles.hint}>
            {isLoading ? t('loading') : isError ? t('error') : t('introHint')}
          </p>
          {isError && (
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('retry')}
            </Button>
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
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('retry')}
              </Button>
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
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleMapNext}
                >
                  {t('next')}
                </Button>
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
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canStartBracket}
            onClick={handleStartBracket}
          >
            {t('startBracket')}
          </Button>
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
