'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  useDestinationDetail,
  useSaveTournament,
  useTournamentRecord,
} from '@/features/tournament/hooks/use-tournament';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button } from '@/components/ui';
import { WinnerCard } from '@/features/tournament/components/WinnerCard';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { TournamentStats } from '@/features/tournament/components/TournamentStats';
import { LuckyLadder } from '@/features/tournament/components/LuckyLadder';
import { useShareCard } from '@/hooks/use-share-card';
import { useRequireAuth } from '@/hooks/use-require-auth';
import styles from './TournamentResultClient.module.scss';

/**
 * 토너먼트 결과 — Figma "TRN · 토너먼트 결과" 정합 (2026-06-24).
 *
 * 구성 (column gap 20):
 *   1) WinnerCard      — hero 320×176 (image + 90deg dark gradient + bottom-left text)
 *   2) WinnerDetailPanel — info-card 320×285 (3 field row + divider + overview)
 *   3) TournamentStats — Frame 47 (title + 4 rchip + lucky color row)
 *   4) LuckyLadder     — ladder card 320×432 (title + caption + ladder svg 280×337)
 *   5) actions         — primary 320×52 "다시 토너먼트" + outline pair "저장"/"공유"
 *
 * LuckyColor 의 행운의 색 row 는 TournamentStats 안으로 흡수됨 (Frame 47 정합).
 * separate `<LuckyColor>` 컴포넌트는 다른 사용처가 없으므로 dead — 추후 삭제 후보.
 */
export function TournamentResultClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');
  const t = useTranslations('tournament.result');

  const recordQuery = useTournamentRecord(recordId);

  const storeWinner = useTournamentStore((s) => s.winner);
  const storeRunnerUp = useTournamentStore((s) => s.runnerUp);
  const storeMatchesPlayed = useTournamentStore((s) => s.matchesPlayed);
  const storeTournamentSize = useTournamentStore(
    (s) => s.config?.tournamentSize,
  );
  const reset = useTournamentStore((s) => s.reset);

  const record = recordQuery.data;
  const winner = record?.winner ?? storeWinner;
  const runnerUp = record?.runnerUp ?? storeRunnerUp;
  const matchesPlayed = record?.matchesPlayed ?? storeMatchesPlayed;
  const tournamentSize = (record?.tournamentSize ??
    storeTournamentSize) as typeof storeTournamentSize;

  const save = useSaveTournament();
  const requireAuth = useRequireAuth();
  const shareCard = useShareCard();
  const detailQuery = useDestinationDetail(winner?.id);

  if (recordId && recordQuery.isLoading && !storeWinner) {
    return (
      <div className={styles.wrap} aria-busy="true">
        <Skeleton width="100%" height={176} radius="lg" />
        <Skeleton width="100%" height={285} radius="lg" />
        <Skeleton width="100%" height={140} radius="lg" />
        <Skeleton width="100%" height={432} radius="lg" />
        <Skeleton width="100%" height={52} radius="md" />
      </div>
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
            variant="outline"
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
