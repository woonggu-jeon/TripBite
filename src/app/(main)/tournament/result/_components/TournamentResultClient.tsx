'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  TOURNAMENT_SIZE_OPTIONS,
  type TournamentCount,
} from '@/features/tournament/types';
import {
  useDestinationDetail,
  useSaveTournament,
  useTournamentRecord,
} from '@/features/tournament/hooks/use-tournament';
import { Button } from '@/components/ui';
import { WinnerCard } from '@/features/tournament/components/WinnerCard';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { TournamentStats } from '@/features/tournament/components/TournamentStats';
import { LuckyLadder } from '@/features/tournament/components/LuckyLadder';
import { SeasonLoadingPanel } from '@/features/tournament/components/SeasonLoadingPanel';
import { useShareCard } from '@/hooks/use-share-card';
import { useRequireAuth } from '@/hooks/use-require-auth';
import styles from './TournamentResultClient.module.scss';

/**
 * 토너먼트 결과 — Figma "TRN · 토너먼트 결과" 정합 (2026-06-24).
 *
 * 구성 (column gap 20):
 *   1) WinnerCard         — hero 320×176 (image + 90deg dark gradient + bottom-left text)
 *   2) WinnerDetailPanel  — info-card 320×285 (3 field row + divider + overview)
 *   3) TournamentStats    — Frame 47 (title + 4 rchip + lucky color row 흡수)
 *   4) LuckyLadder        — ladder card 320×432 (title + caption + ladder svg 280×337)
 *   5) actions            — primary 320×52 "결과 공유하기" + outline pair (다시하기 / 마이페이지에 저장)
 */
export function TournamentResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');
  const t = useTranslations('tournament.result');

  const recordQuery = useTournamentRecord(recordId);

  // 5개 분산 selector → 단일 selector + 객체 통합 (자율 검토 2026-06-25). 단
  // 객체 selector 는 매번 new instance → React getSnapshot 무한 loop. zustand
  // 5의 `useShallow` 로 shallow compare → 같은 키 동일 값이면 같은 reference
  // 유지 (사용자 보고 2026-06-25 — getSnapshot cache 회귀 fix).
  const {
    storeWinner,
    storeRunnerUp,
    storeMatchesPlayed,
    storeTournamentSize,
    storeSeason,
  } = useTournamentStore(
    useShallow((s) => ({
      storeWinner: s.winner,
      storeRunnerUp: s.runnerUp,
      storeMatchesPlayed: s.matchesPlayed,
      storeTournamentSize: s.config?.tournamentSize,
      storeSeason: s.config?.theme.value,
    })),
  );
  const reset = useTournamentStore((s) => s.reset);

  const record = recordQuery.data;
  const winner = record?.winner ?? storeWinner;
  const runnerUp = record?.runnerUp ?? storeRunnerUp;
  const matchesPlayed = record?.matchesPlayed ?? storeMatchesPlayed;
  // BE record.tournamentSize 는 number, store 는 TournamentCount union.
  // TOURNAMENT_SIZE_OPTIONS 로 type guard — `as` cast 우회 회피 (자율 검토
  // 2026-06-25).
  const recSize = record?.tournamentSize;
  const tournamentSize: TournamentCount | undefined =
    recSize != null &&
    (TOURNAMENT_SIZE_OPTIONS as readonly number[]).includes(recSize)
      ? (recSize as TournamentCount)
      : storeTournamentSize;

  const save = useSaveTournament();
  const requireAuth = useRequireAuth();
  const shareCard = useShareCard();
  const detailQuery = useDestinationDetail(winner?.id);

  // deep-link 진입 (?id=) + record fetch 중 + store winner 없을 때 fallback.
  // 큰 5-stack skeleton (hero/info/stats/ladder/actions) → SeasonLoadingPanel
  // 로 통일 (사용자 명시 2026-06-25 — 깜빡임 회귀). store season 없으면
  // autumn fallback (deep-link 만 진입 시 config 정보 없음).
  if (recordId && recordQuery.isLoading && !storeWinner) {
    return (
      <SeasonLoadingPanel
        season={storeSeason ?? 'autumn'}
        title={t('loading')}
      />
    );
  }

  if (!winner) {
    return (
      <div className={styles.empty}>
        <p>{t('noWinner')}</p>
        <Button variant="primary" onClick={() => router.replace('/tournament')}>
          {t('goSetup')}
        </Button>
      </div>
    );
  }

  const handleSave = () => {
    if (save.isPending || save.isSuccess) return;
    void requireAuth(() => save.mutate(winner.id), {
      reason: t('saveRequireAuth'),
    });
  };

  const handleRetry = () => {
    reset();
    router.replace('/tournament');
  };

  const handleShare = () => {
    const params = new URLSearchParams({
      winner: winner.name,
      region: winner.region,
      category: winner.category,
      ...(matchesPlayed > 0 ? { matches: String(matchesPlayed) } : {}),
      ...(detailQuery.data?.description
        ? { desc: detailQuery.data.description }
        : {}),
    });
    return shareCard({
      imageUrl: `/api/og/tournament?${params.toString()}`,
      filename: `tripbite-tournament-${winner.id}.png`,
    });
  };

  return (
    <div className={styles.wrap}>
      <WinnerCard destination={winner} />
      <WinnerDetailPanel
        detail={detailQuery.data}
        isLoading={detailQuery.isLoading}
      />
      <TournamentStats
        winner={winner}
        runnerUp={runnerUp}
        matchesPlayed={matchesPlayed}
        tournamentSize={tournamentSize}
      />
      <LuckyLadder />

      {/* Figma Frame 48 — column gap 8: primary 320×52 (공유) + outline pair
          (다시하기, 마이페이지에 저장). 사용자 명시 순서 (2026-06-24). */}
      <div className={styles.actions}>
        <Button variant="primary" size="lg" fullWidth onClick={handleShare}>
          {t('shareShort')}
        </Button>
        <div className={styles.actionPair}>
          <Button variant="outline" fullWidth onClick={handleRetry}>
            {t('retryTournament')}
          </Button>
          <Button
            variant="outlinePrimary"
            fullWidth
            onClick={handleSave}
            disabled={save.isSuccess}
            loading={save.isPending}
          >
            {save.isSuccess ? t('saved') : t('saveShort')}
          </Button>
        </div>
      </div>
    </div>
  );
}
