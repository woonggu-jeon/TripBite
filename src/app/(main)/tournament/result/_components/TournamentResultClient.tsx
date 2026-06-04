'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Share2 } from 'lucide-react';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  useDestinationDetail,
  useSaveTournament,
} from '@/features/tournament/hooks/use-tournament';
import { Button } from '@/components/ui';
import { WinnerCard } from '@/features/tournament/components/WinnerCard';
import { WinnerDetailPanel } from '@/features/tournament/components/WinnerDetailPanel';
import { TournamentStats } from '@/features/tournament/components/TournamentStats';
import { LuckyColor } from '@/features/tournament/components/LuckyColor';
import { LuckyLadder } from '@/features/tournament/components/LuckyLadder';
import { toast } from '@/lib/toast';
import { useShareCard } from '@/hooks/use-share-card';
import { useRequireAuth } from '@/hooks/use-require-auth';
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
 * [FUTURE: BE(NestJS) 연동 시 처리 포인트]
 *
 * 현재 winner/runnerUp/matchesPlayed/tournamentSize 는 전부 store-only.
 * 즉 같은 SPA 세션 안에서 setup → play → result 흐름 안에서만 보존됨.
 *
 * 새로고침/공유 링크/마이페이지에서 다시 보기 등 deep-link 진입을 지원하려면:
 *   - URL: /tournament/result?id={tournamentId}  또는  /mypage/tournaments/[id]
 *   - useQuery(['tournament', id], () => api.getTournament(id))
 *     로 winner/runnerUp/matchesPlayed/tournamentSize 까지 fetch.
 *   - 이때 wrap 영역(`styles.wrap`)에 min-height 박아두고
 *     WinnerCard / TournamentStats 도 isLoading → Skeleton 분기 추가.
 *   - 현재 `if (!winner) → noWinner 안내` 는 _진행 중 store 가 비었을 때_ 와
 *     _서버에서 못 찾았을 때_ 가 합쳐지므로, isError vs notFound 분기로 갈라야 함.
 *
 * 또한 저장 흐름:
 *   - 지금은 mutation 결과만 사용. BE 후에는 onSuccess → router.replace 로
 *     `/mypage/tournaments/{id}` 로 보내 store 가 사라져도 결과를 다시 볼 수 있게.
 *   - queryClient.invalidateQueries(mypageKeys.tournaments) 도 추가.
 *
 * 정책 [[rendering-speed-first]] 유지: 결과 페이지 진입 시 본문/통계 전부
 * skeleton-first. 미리 prefetch 하지 않음.
 * ─────────────────────────────────────────────────────────────
 */
export function TournamentResultClient() {
  const router = useRouter();
  const t = useTranslations('tournament.result');
  const tCommon = useTranslations('common');
  const winner = useTournamentStore((s) => s.winner);
  const runnerUp = useTournamentStore((s) => s.runnerUp);
  const matchesPlayed = useTournamentStore((s) => s.matchesPlayed);
  const tournamentSize = useTournamentStore((s) => s.config?.tournamentSize);
  const reset = useTournamentStore((s) => s.reset);
  const save = useSaveTournament();
  const requireAuth = useRequireAuth();
  const shareCard = useShareCard();
  // 우승자 풍부 정보 — winner.id 기준 별도 fetch.
  // winner/stats 는 store 만으로 즉시 렌더 → 상세는 비동기로 채워짐 (렌더 속도 우선).
  // [FUTURE BE] deep-link 진입 시 winner 자체가 없을 수 있음 →
  //   useQuery(['tournament', id]) 로 winner/stats 까지 받아오는 분기 추가 필요.
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
        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={save.isSuccess}
          loading={save.isPending}
        >
          {saveLabel}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={handleShare}
          leadingIcon={<Share2 size={16} aria-hidden />}
        >
          {tCommon('share')}
        </Button>
        <Button variant="ghost" fullWidth onClick={handleRetry}>
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
