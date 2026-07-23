'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bracket } from '@/features/tournament/components/Bracket';
import { SeasonLoadingPanel } from '@/features/tournament/components/SeasonLoadingPanel';
import type { DestinationDto } from '@/api/generated/schemas';
import type { BracketResult } from '@/features/tournament/types';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  useRecordTournament,
  useTournamentCandidates,
} from '@/features/tournament/hooks/use-tournament';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { toast } from '@/lib/toast';
import styles from './TournamentPlayClient.module.scss';

type Phase = 'bracket' | 'celebration';

const CELEBRATION_MS = 1800;

/**
 * 토너먼트 매치 진행 — Bracket + Celebration (2026-06-24 refactor).
 *
 * setup phase 들 (intro/map/tournamentSize) 은 `/tournament` (TournamentSetup)
 * 으로 이동. `/tournament/play` 진입 시점에는:
 *   - config.theme / categories / count
 *   - config.selectedRegions (map step 에서 set)
 *   - config.tournamentSize (size step 에서 set)
 * 모두 store 에 있음 — 진입 가드 X 면 즉시 bracket fetch + render.
 *
 * 진입 가드:
 *   - selectedRegions 없거나 tournamentSize null → /tournament 로 replace.
 *
 * Phase:
 *   1) bracket      : useTournamentCandidates(config) → fetched → Bracket
 *                     매치 진행 (사용자 선택 → 다음 매치)
 *   2) celebration  : 우승자 1.8s 강조 → record mutation → /result 자동 이동
 *
 * BE 연동:
 *   - record mutation 은 fire-and-forget (실패해도 store 만으로 result 진입).
 *   - id 반환 시 ?id= 로 deep-link, 실패 시 store-only.
 *
 * 정책 [[rendering-speed-first]]: bracket 진행 중 추가 fetch 금지.
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const t = useTranslations('tournament.play');
  const config = useTournamentStore((s) => s.config);
  const setBracketResult = useTournamentStore((s) => s.setBracketResult);
  const record_ = useRecordTournament();

  const [phase, setPhase] = useState<Phase>('bracket');
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

  // 진입 가드 — setup 미완성 (config 또는 tournamentSize 또는 selectedRegions 없음)
  // 시 setup 으로 replace. user 가 직접 URL 진입 / store reset 후 진입 케이스.
  useEffect(() => {
    if (
      !config ||
      !config.tournamentSize ||
      !config.selectedRegions ||
      config.selectedRegions.length === 0
    ) {
      router.replace('/tournament');
    }
  }, [config, router]);

  // celebration → result 자동 이동 + record mutation (fire-and-forget)
  useEffect(() => {
    if (phase !== 'celebration' || !pendingResult) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 400 : CELEBRATION_MS;
    const id = window.setTimeout(async () => {
      setBracketResult(pendingResult);
      let recordId: string | undefined;
      try {
        const record = await record_.mutateAsync({
          winnerId: pendingResult.winner.id,
          runnerUpId: pendingResult.runnerUp?.id ?? null,
          matchesPlayed: pendingResult.matchesPlayed,
          tournamentSize: config?.tournamentSize ?? 0,
          // 신규 BE recordTournament 는 winnerName 필수 + region/category.
          winnerName: pendingResult.winner.name,
          region: pendingResult.winner.region,
          category: pendingResult.winner.category,
        });
        recordId = record.id;
      } catch {
        toast.error(t('recordFailedToast'));
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

  // 매치업 destinations 구성 (시군 unique 우선 + id 중복 차단).
  const matchupSize = config?.tournamentSize ?? 0;
  const matchupDestinations = useMemo<DestinationDto[]>(() => {
    if (!pool || matchupSize <= 0) return [];
    const seenRegions = new Set<string>();
    const seenIds = new Set<string>();
    const picked: DestinationDto[] = [];
    for (const d of pool) {
      if (seenRegions.has(d.region)) continue;
      seenRegions.add(d.region);
      seenIds.add(d.id);
      picked.push(d);
      if (picked.length >= matchupSize) return picked;
    }
    for (const d of pool) {
      if (seenIds.has(d.id)) continue;
      seenIds.add(d.id);
      picked.push(d);
      if (picked.length >= matchupSize) break;
    }
    return picked;
  }, [pool, matchupSize]);

  // 진입 가드 redirect 직전의 빈 화면 — config 검증 대기.
  if (
    !config ||
    !config.tournamentSize ||
    !config.selectedRegions ||
    config.selectedRegions.length === 0
  ) {
    return <div className={styles.wrap} aria-busy="true" />;
  }

  const handleBracketComplete = (result: BracketResult) => {
    setPendingResult(result);
    setPhase('celebration');
  };

  return (
    <div className={styles.wrap}>
      {phase === 'bracket' && (
        <div className={styles.bracket}>
          {isLoading && (
            <SeasonLoadingPanel
              season={config.theme.value}
              title={t('loading')}
            />
          )}
          {isError && (
            <div className={styles.errorBox}>
              <p>{t('error')}</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            </div>
          )}
          {!isLoading &&
            !isError &&
            pool &&
            matchupDestinations.length === 0 && (
              <EmptyState
                icon={
                  <span aria-hidden style={{ fontSize: 32 }}>
                    🗺️
                  </span>
                }
                title={t('emptyPool.title')}
                description={t('emptyPool.hint')}
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.replace('/tournament')}
                  >
                    {t('emptyPool.back')}
                  </Button>
                }
              />
            )}
          {matchupDestinations.length > 0 && (
            <Bracket
              destinations={matchupDestinations}
              onComplete={handleBracketComplete}
            />
          )}
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
