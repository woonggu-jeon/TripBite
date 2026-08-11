'use client';

import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/feedback/EmptyState';
import { SkeletonList } from '@/components/feedback/SkeletonList';
import { Button } from '@/components/ui';
import { useTournamentHistory } from '@/features/tournament/hooks/use-tournament';
import styles from './TournamentHistorySection.module.scss';

/** Figma `recent-box` 에 들어가는 행 수 — 마이페이지는 최근 2건만 보여준다. */
const RECENT_LIMIT = 2;

const CATEGORY_KO: Record<string, string> = {
  local: '지역',
  festival: '축제',
  attraction: '관광지',
  experience: '체험',
};

// Spring TournamentSummaryDto 파생 — theme/winnerId/winnerRegion 미제공.
type HistoryItem = {
  id: string;
  category: string;
  tournamentSize: number;
  winnerName?: string;
  completedAt: string;
};

/**
 * 토너먼트 기록 — 사용자가 진행한 토너먼트의 시즌/유형/갯수/완료 시각 row 리스트.
 *
 * useTournamentHistory → GET /mypage/tournament-history.
 * mock 은 단일 페이지 — BE 도입 시 InfiniteList 로 확장.
 */
export function TournamentHistorySection() {
  const t = useTranslations('mypage.tournamentHistory');
  const { data, isLoading, isError, refetch } = useTournamentHistory();

  if (isLoading) {
    return (
      <div className={styles.skeletonList}>
        <SkeletonList count={2} height={68} radius="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Trophy size={28} aria-hidden />}
        title={t('error')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  const items = (data?.items as HistoryItem[] | undefined) ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={28} aria-hidden />}
        title={t('empty')}
        variant="card"
      />
    );
  }

  return (
    <ul className={styles.list}>
      {/* Figma `recent-box` 는 2행 고정이다 (섹션 제목이 "최근 …" 이고
          "전체 보기" 링크도 없다). 구 구현은 10행까지 쌓아 마이페이지가
          시안(809)보다 훨씬 길어졌다. */}
      {items.slice(0, RECENT_LIMIT).map((it) => {
        // category 가 비어 오는 기록이 있어 "undefined강" 으로 새던 것 방지 —
        // 빈 조각은 빼고 " · " 로 잇는다.
        const categoryLabel = CATEGORY_KO[it.category] ?? it.category;
        const date = new Date(it.completedAt);
        const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`;
        const meta = [
          categoryLabel,
          `${it.tournamentSize}${t('countUnit')}`,
          dateLabel,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <li key={it.id} className={styles.row}>
            <span className={styles.emoji} aria-hidden>
              {/* Spring 은 시즌(theme) 미제공 → 트로피 아이콘 고정. */}
              <Trophy size={24} aria-hidden />
            </span>
            <div className={styles.body}>
              <p className={styles.title}>
                {it.winnerName ?? t('unknownWinner')}
              </p>
              <p className={styles.meta}>{meta}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
