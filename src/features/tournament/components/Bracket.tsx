'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useReducer } from 'react';
import type { DestinationDto } from '@/api/generated/schemas';
import type { BracketResult } from '@/features/tournament/types';
import {
  type RoundState,
  pairRound,
  roundLabelKey,
} from '@/features/tournament/utils/bracket';
import styles from './Bracket.module.scss';
import { MatchupCard } from './MatchupCard';

interface BracketState {
  rounds: RoundState[];
  currentRoundIndex: number;
  currentMatchIndex: number;
  done: boolean;
  winner: DestinationDto | null;
}

type Action = { type: 'pick'; winner: DestinationDto };

function reducer(state: BracketState, action: Action): BracketState {
  switch (action.type) {
    case 'pick': {
      const round = state.rounds[state.currentRoundIndex];
      if (!round) return state;
      const newMatches = round.matches.map((m, i) =>
        i === state.currentMatchIndex ? { ...m, winner: action.winner } : m,
      );
      const updatedRound = { ...round, matches: newMatches };
      const newRounds = state.rounds.slice();
      newRounds[state.currentRoundIndex] = updatedRound;

      // 같은 라운드 다음 매치
      if (state.currentMatchIndex < newMatches.length - 1) {
        return {
          ...state,
          rounds: newRounds,
          currentMatchIndex: state.currentMatchIndex + 1,
        };
      }

      // 라운드 종료 — winners 모음
      const winners = newMatches
        .map((m) => m.winner)
        .filter((w): w is DestinationDto => !!w);
      if (round.bye) winners.push(round.bye);

      // 최종 우승
      if (winners.length === 1) {
        return {
          ...state,
          rounds: newRounds,
          done: true,
          winner: winners[0] ?? null,
        };
      }

      // 다음 라운드
      const nextRound = pairRound(winners);
      return {
        rounds: [...newRounds, nextRound],
        currentRoundIndex: state.currentRoundIndex + 1,
        currentMatchIndex: 0,
        done: false,
        winner: null,
      };
    }
  }
}

function initState(destinations: DestinationDto[]): BracketState {
  if (destinations.length === 0) {
    return {
      rounds: [],
      currentRoundIndex: 0,
      currentMatchIndex: 0,
      done: false,
      winner: null,
    };
  }
  // 1명만 선택했으면 즉시 우승
  if (destinations.length === 1) {
    return {
      rounds: [
        {
          participants: destinations,
          matches: [],
          bye: destinations[0] ?? null,
        },
      ],
      currentRoundIndex: 0,
      currentMatchIndex: 0,
      done: true,
      winner: destinations[0] ?? null,
    };
  }
  return {
    rounds: [pairRound(destinations)],
    currentRoundIndex: 0,
    currentMatchIndex: 0,
    done: false,
    winner: null,
  };
}

function useRoundLabel(participants: number): string {
  const t = useTranslations('tournament.play.matchup');
  const key = roundLabelKey(participants);
  if (key.kind === 'final') return t('final');
  if (key.kind === 'semifinal') return t('semifinal');
  if (key.kind === 'quarterfinal') return t('quarterfinal');
  return t('roundOfN', { n: key.n });
}

export interface BracketProps {
  destinations: DestinationDto[];
  onComplete: (result: BracketResult) => void;
}

/**
 * 토너먼트 1:1 매치업 — 세로 2칸 카드 + progress bar.
 *
 * 알고리즘:
 *   - 라운드마다 pairRound 로 매치/bye 결정 (홀수면 1명 부전승)
 *   - 사용자가 매치마다 winner 선택 → 같은 라운드 다음 매치
 *   - 라운드 종료 시 winners + bye 로 다음 라운드 자동 생성
 *   - 마지막 1명 → onComplete(winner)
 */
export function Bracket({ destinations, onComplete }: BracketProps) {
  const t = useTranslations('tournament.play.matchup');
  const [state, dispatch] = useReducer(reducer, destinations, initState);

  const round = state.rounds[state.currentRoundIndex];
  const label = useRoundLabel(round?.participants.length ?? 0);

  // 결승 상대 (마지막으로 채워진 매치의 패자) — 결승전이 실제로 있었던 경우만.
  const runnerUp = useMemo<DestinationDto | null>(() => {
    if (!state.done || !state.winner) return null;
    const lastRound = state.rounds[state.rounds.length - 1];
    const finalMatch = lastRound?.matches[lastRound.matches.length - 1];
    if (!finalMatch?.winner) return null;
    return finalMatch.winner.id === finalMatch.a.id
      ? finalMatch.b
      : finalMatch.a;
  }, [state.done, state.winner, state.rounds]);

  // 결정된 매치 수 = participants - 1 (bye 포함 시에도 일관)
  const matchesPlayed = useMemo(
    () => state.rounds.flatMap((r) => r.matches).filter((m) => m.winner).length,
    [state.rounds],
  );

  // 최종 우승 시 부모로 전파
  useEffect(() => {
    if (state.done && state.winner) {
      onComplete({ winner: state.winner, runnerUp, matchesPlayed });
    }
  }, [state.done, state.winner, runnerUp, matchesPlayed, onComplete]);

  if (!round) return null;
  if (state.done) {
    return (
      <div className={styles.wrap}>
        <p className={styles.doneMsg}>{t('autoWin')}</p>
      </div>
    );
  }

  const match = round.matches[state.currentMatchIndex];
  if (!match) return null;

  // 진행도 — 라운드 안 매치 수 기준 (32강=16, 16강=8, 8강=4, 4강=2).
  // 결승(1 매치)은 segment 자체 의미 없음 → 숨김. 사용자 요청 (2026-06-19) —
  // 전체 N-1 (32강=31개) 으로 표시하면 너무 많아 부담. roundLabel + matchCount
  // 가 이미 라운드 진입 신호 + 매치 진행 신호 동시 제공.
  const roundMatchCount = round.matches.length;
  const decidedInRound = round.matches.filter(
    (m) => m.winner !== undefined,
  ).length;
  const showProgress = roundMatchCount > 1;
  const progress = showProgress
    ? Math.min(100, (decidedInRound / roundMatchCount) * 100)
    : 0;
  const segments = Array.from({ length: roundMatchCount });

  return (
    <div className={styles.wrap}>
      {/* Frame 43: top row + segments — 결승은 progress 의미 X (segment 미렌더).
          좌측 = "{label} · 매치 {current}/{total}", 우측 = "남은 매치 N".
          remain = 라운드 안 아직 결정 안 된 매치 수 (현재 매치 포함 X = 진행
          중인 매치 끝나면 -1). 사용자 명시 (2026-06-24) 카피 정합. */}
      <div className={styles.progressFrame}>
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>
            {t('roundMatchProgress', {
              label,
              current: state.currentMatchIndex + 1,
              total: round.matches.length,
            })}
          </span>
          <span className={styles.matchCount}>
            {t('remainMatches', {
              remain: round.matches.length - state.currentMatchIndex - 1,
            })}
          </span>
        </div>
        {showProgress ? (
          <div
            className={styles.segments}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={t('progressLabel')}
          >
            {segments.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={
                  i < decidedInRound
                    ? `${styles.seg} ${styles.segDone}`
                    : styles.seg
                }
              />
            ))}
          </div>
        ) : (
          <div className={styles.segments} aria-hidden />
        )}
      </div>

      {/* 라운드 안내 문구 — B_20 fg. 사용자 요청 (2026-06-19) 단순화 */}
      <h2 className={styles.roundTitle}>{t('pickPrompt')}</h2>

      {/* match-area: hero stacked × 2 + VS absolute center 36 circle */}
      <div className={styles.matchArea}>
        {/* key 에 match.a.id / match.b.id — 매치 변경 시 button DOM 자체가
            unmount/remount 되어 focus + (touch 환경의) sticky 상태가 강제
            리셋. 같은 DOM 재사용 시 ios safari 에서 이전 선택지가 다음 매치에
            도 강조 유지되던 회귀 차단. */}
        <MatchupCard
          key={match.a.id}
          destination={match.a}
          onPick={() => dispatch({ type: 'pick', winner: match.a })}
        />
        <MatchupCard
          key={match.b.id}
          destination={match.b}
          onPick={() => dispatch({ type: 'pick', winner: match.b })}
        />
        <div className={styles.vs} aria-hidden>
          VS
        </div>
      </div>
    </div>
  );
}
