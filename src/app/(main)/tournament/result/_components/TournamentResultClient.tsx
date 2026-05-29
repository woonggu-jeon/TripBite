'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  useDestinationDetail,
  useSaveTournament,
} from '@/features/tournament/hooks/use-tournament';
import { WinnerCard } from '@/features/tournament/components/WinnerCard';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { TournamentStats } from '@/features/tournament/components/TournamentStats';
import { LuckyColor } from '@/features/tournament/components/LuckyColor';
import { LuckyLadder } from '@/features/tournament/components/LuckyLadder';
import styles from './TournamentResultClient.module.scss';

/**
 * 토너먼트 결과 클라이언트
 *
 * 구성:
 *   1) WinnerCard  — 우승 여행지(이름·시군·카테고리)
 *   2) LuckyColor  — winner.id seed 기반 deterministic 행운의 색
 *   3) LuckyLadder — 인연 만날 확률 사다리타기
 *   4) 액션        — 마이페이지 저장 / 다시 하기
 *
 * 저장: useSaveTournament(useMutation) → POST /mypage/tournaments
 *   - 성공 시 버튼 라벨 "저장됐어요" 로 전환 + disabled
 *   - 실패 시 다시 시도 가능
 *
 * 설정/우승자 없이 진입 시: redirect 대신 안내(백엔드 미연결 정책).
 */
export function TournamentResultClient() {
  const router = useRouter();
  const t = useTranslations('tournament.result');
  const winner = useTournamentStore((s) => s.winner);
  const runnerUp = useTournamentStore((s) => s.runnerUp);
  const matchesPlayed = useTournamentStore((s) => s.matchesPlayed);
  const tournamentSize = useTournamentStore((s) => s.config?.tournamentSize);
  const reset = useTournamentStore((s) => s.reset);
  const save = useSaveTournament();
  // 우승자 풍부 정보 — winner.id 기준 별도 fetch.
  // winner/stats 는 store 만으로 즉시 렌더 → 상세는 비동기로 채워짐 (렌더 속도 우선).
  const detailQuery = useDestinationDetail(winner?.id);

  if (!winner) {
    return (
      <div className={styles.empty}>
        <p>{t('noWinner')}</p>
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

  const handleSave = () => {
    if (save.isPending || save.isSuccess) return;
    save.mutate(winner.id);
  };

  const handleRetry = () => {
    reset();
    router.replace('/tournament');
  };

  const saveLabel = save.isPending
    ? t('saving')
    : save.isSuccess
      ? t('saved')
      : save.isError
        ? t('saveFailed')
        : t('saveToMypage');

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
      <LuckyColor seed={winner.id} />

      <section className={styles.ladderSection} aria-label={t('meetChance')}>
        <header className={styles.ladderHeader}>
          <h3 className={styles.ladderTitle}>
            <span aria-hidden>🎲</span>
            {t('meetChance')}
          </h3>
          <p className={styles.ladderSubtitle}>{t('ladder.subtitle')}</p>
        </header>
        <LuckyLadder />
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={handleSave}
          disabled={save.isPending || save.isSuccess}
        >
          {saveLabel}
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={handleRetry}
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
