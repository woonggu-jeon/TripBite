import { create } from 'zustand';
import type { ResolvedLocation } from '@/features/location/types';

/**
 * 위치 store
 *
 * 한 번 resolve된 좌표/지역명을 페이지/스텝 간 공유 — 매번 재요청 방지.
 *
 * 원칙:
 *   - 서버 데이터 아님 (TanStack Query가 담당) → 가벼운 클라이언트 상태만
 *   - 세션 동안만 유지 (persist 안 함). 다음 진입 시 다시 resolve.
 *   - 좌표는 PII로 취급. analytics에 raw 전송 금지.
 */
type LocationState = {
  resolved: ResolvedLocation | null;
};

type LocationActions = {
  setResolved: (loc: ResolvedLocation) => void;
  clear: () => void;
};

export const useLocationStore = create<LocationState & LocationActions>(
  (set) => ({
    resolved: null,
    setResolved: (resolved) => set({ resolved }),
    clear: () => set({ resolved: null }),
  }),
);
