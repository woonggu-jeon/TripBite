'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';
import { Button, ButtonGrid } from '@/components/ui';
import { LuckyColor } from '@/features/tournament/components/LuckyColor';
import { LuckyLadder } from '@/features/tournament/components/LuckyLadder';
import { TournamentStats } from '@/features/tournament/components/TournamentStats';
import { WinnerCard } from '@/features/tournament/components/WinnerCard';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import {
  useDestinationDetail,
  useSaveTournament,
} from '@/features/tournament/hooks/use-tournament';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useShareCard } from '@/hooks/use-share-card';
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
 *
 * ─────────────────────────────────────────────────────────────
 * [결과 딥링크 미지원 — 상세는 아래 BE-TODO(§5 P2-2)]
 *
 * winner/runnerUp/matchesPlayed/tournamentSize 는 전부 store-only(같은 SPA
 * 세션의 setup → play → result 흐름 안에서만 보존). Spring 은 `GET /tournaments/{id}`
 * 가 없어 cold 진입(새로고침/공유 링크)은 아래 `if (!winner) → noWinner` 로 degrade.
 *
 * 정식 딥링크 API 도입 시 처리 포인트:
 *   - `?id=` 로 record fetch(기록은 이미 `POST /mypage/tournament-history` 로 저장됨).
 *   - `if (!winner)` 를 isError vs notFound 로 분기(현재는 두 경우가 합쳐져 있음).
 *   - 저장 onSuccess → `/mypage/tournaments/{id}` replace + mypage tournaments invalidate.
 * 정책 [[rendering-speed-first]]: 진입 시 skeleton-first, prefetch 안 함.
 * ─────────────────────────────────────────────────────────────
 */
export function TournamentResultClient() {
  const router = useRouter();
  const t = useTranslations('tournament.result');

  // BE-TODO(§5 P2-2): 결과 딥링크 복원 — Spring 미지원(GET /tournaments/{id} 없음) →
  //   결과는 store 전용. cold 진입(새로고침/공유 링크)은 아래 noWinner 로 degrade.
  //   엔드포인트 추가 시 ?id= 로 record fetch(useTournamentRecord) 복원.
  const winner = useTournamentStore((s) => s.winner);
  const runnerUp = useTournamentStore((s) => s.runnerUp);
  const matchesPlayed = useTournamentStore((s) => s.matchesPlayed);
  const tournamentSize = useTournamentStore((s) => s.config?.tournamentSize);
  const reset = useTournamentStore((s) => s.reset);

  const save = useSaveTournament();
  const requireAuth = useRequireAuth();
  const shareCard = useShareCard();
  // 우승자 풍부 정보 — winner.id 기준 별도 fetch.
  const detailQuery = useDestinationDetail(winner?.id);

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

  /**
   * 결과 카드 이미지 공유 — `/api/og/tournament` 가 query → 이미지 PNG 생성.
   * deep-link 불필요 — 받는 쪽은 이미지 파일만 받음.
   * 결과 데이터는 URL query 로 인코딩 (winner name / region / category / matches).
   *
   * payload 는 file 단독 — title/text 동반 시 일부 share target (예: 카카오톡) 이
   * 텍스트만 클립보드로 분리 처리하고 file 첨부 흐름이 끊긴다. file 만 보내야
   * OS 가 채팅 채널 선택 → 이미지 첨부의 정상 분기로 진행.
   */
  const handleShare = () => {
    const params = new URLSearchParams({
      winner: winner.name,
      region: winner.region,
      category: winner.category,
      ...(matchesPlayed > 0 ? { matches: String(matchesPlayed) } : {}),
    });
    return shareCard({
      imageUrl: `/api/og/tournament?${params.toString()}`,
      filename: `tripbite-tournament-${winner.id}.png`,
    });
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
        <ButtonGrid>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleShare}
            leadingIcon={<Icon name="share-18" size={16} />}
          >
            {t('share')}
          </Button>
          <Button variant="ghost" fullWidth onClick={handleRetry}>
            {t('retry')}
          </Button>
        </ButtonGrid>
        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={save.isSuccess}
          loading={save.isPending}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
