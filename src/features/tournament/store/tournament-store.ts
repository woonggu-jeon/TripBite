import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DestinationDto } from '@/api/generated/schemas';
import type {
  BracketResult,
  TournamentConfig,
  TournamentCount,
} from '@/features/tournament/types';

/**
 * 토너먼트 흐름 상태
 *
 * 페이지 간 (/tournament → /play → /result) 상태 공유.
 *
 * iOS PWA 휘발성 대비:
 *   - iOS PWA 는 백그라운드 진입 후 빠르게 메모리에서 폐기됨
 *   - 토너먼트 진행 중 다른 앱 보고 돌아오면 store 가 사라지면 UX 손상
 *   - sessionStorage 로 백업 → 같은 세션 내에선 복원
 *   - 새로 켜면 (탭 종료 후 재진입) 자동으로 비워짐 — 의도된 동작
 *
 * persist 옵션:
 *   - storage: sessionStorage (탭 닫으면 사라짐)
 *   - name: 키 prefix
 *   - partialize: server 데이터는 제외 (winner 의 일부 필드만 저장 가능)
 *
 * 서버 데이터 (참가 여행지 N개)는 TanStack Query 담당. 여기엔 저장 X.
 */
type TournamentState = {
  config: TournamentConfig | null;
  winner: DestinationDto | null;
  /** 결승 상대 (참가 1명이거나 bye 우승이면 null) — Result 화면 stat 카드용. */
  runnerUp: DestinationDto | null;
  /** 결정된 매치 수 — Result 화면 "총 N매치" 표시용. */
  matchesPlayed: number;
};

type TournamentActions = {
  setConfig: (config: TournamentConfig) => void;
  /**
   * Play 의 map phase 에서 호출 — random pick 한 N 시군 코드 set.
   * BE 가 destinations 응답할 때 이 시군들 안에서만 추출하도록 query 에 전달.
   */
  setSelectedRegions: (regions: string[]) => void;
  /**
   * Play 페이지의 tournamentSize phase 에서 호출.
   * config.tournamentSize 만 갱신해 백엔드 호출 파라미터로 전달되도록.
   */
  setTournamentSize: (size: TournamentCount) => void;
  setWinner: (winner: DestinationDto) => void;
  /** Bracket onComplete 결과(우승자/결승상대/매치수) 일괄 저장. */
  setBracketResult: (result: BracketResult) => void;
  reset: () => void;
};

export const useTournamentStore = create<TournamentState & TournamentActions>()(
  persist(
    (set) => ({
      config: null,
      winner: null,
      runnerUp: null,
      matchesPlayed: 0,

      setConfig: (config) => set({ config }),
      setSelectedRegions: (regions) =>
        set((state) =>
          state.config
            ? { config: { ...state.config, selectedRegions: regions } }
            : { config: state.config },
        ),
      setTournamentSize: (size) =>
        set((state) =>
          state.config
            ? { config: { ...state.config, tournamentSize: size } }
            : { config: state.config },
        ),
      setWinner: (winner) => set({ winner }),
      setBracketResult: (result) =>
        set({
          winner: result.winner,
          runnerUp: result.runnerUp,
          matchesPlayed: result.matchesPlayed,
        }),
      reset: () =>
        set({ config: null, winner: null, runnerUp: null, matchesPlayed: 0 }),
    }),
    {
      // 다른 store 와 prefix 정합 ('tripbite.*'). 3rd-party storage key 충돌
      // 회피 (auth/ui/letter 와 동일 패턴). sessionStorage 라 탭 닫힘 시 무손실.
      name: 'tripbite.tournament',
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? // SSR no-op
            {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : sessionStorage,
      ),
      // server 데이터 일부 필드만 저장하려면 partialize 사용
      partialize: (state) => ({
        config: state.config,
        winner: state.winner,
        runnerUp: state.runnerUp,
        matchesPlayed: state.matchesPlayed,
      }),
    },
  ),
);
