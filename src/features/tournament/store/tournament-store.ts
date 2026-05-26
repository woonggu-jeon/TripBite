import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Destination,
  TournamentConfig,
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
  winner: Destination | null;
};

type TournamentActions = {
  setConfig: (config: TournamentConfig) => void;
  setWinner: (winner: Destination) => void;
  reset: () => void;
};

export const useTournamentStore = create<TournamentState & TournamentActions>()(
  persist(
    (set) => ({
      config: null,
      winner: null,

      setConfig: (config) => set({ config }),
      setWinner: (winner) => set({ winner }),
      reset: () => set({ config: null, winner: null }),
    }),
    {
      name: 'tournament',
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? // SSR no-op
            { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }
          : sessionStorage,
      ),
      // server 데이터 일부 필드만 저장하려면 partialize 사용
      partialize: (state) => ({ config: state.config, winner: state.winner }),
    },
  ),
);
