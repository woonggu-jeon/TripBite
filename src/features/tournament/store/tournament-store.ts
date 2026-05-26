import { create } from 'zustand';
import type {
  Destination,
  TournamentConfig,
} from '@/features/tournament/types';

/**
 * 토너먼트 흐름 상태
 *
 * (아키텍처 문서 7번 - Zustand는 전역 UI 상태만 담당)
 * 토너먼트 진행 동안 페이지 간(/tournament → /play → /result) 상태 공유.
 *
 * 새로고침 시 휘발 (의도된 동작) — 진행 중 새로고침하면 /tournament 로 복귀.
 *
 * 서버 데이터 (참가 여행지 N개)는 TanStack Query가 담당. 여기엔 저장하지 않음.
 */
type TournamentState = {
  config: TournamentConfig | null;
  winner: Destination | null;
};

type TournamentActions = {
  setConfig: (config: TournamentConfig) => void;
  setWinner: (winner: Destination) => void;
  reset: () => void;
};

export const useTournamentStore = create<TournamentState & TournamentActions>(
  (set) => ({
    config: null,
    winner: null,

    setConfig: (config) => set({ config }),
    setWinner: (winner) => set({ winner }),
    reset: () => set({ config: null, winner: null }),
  }),
);
