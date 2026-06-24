import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * 마지막으로 보낸 편지 — /letter/compose → /letter/sent 페이지 전환에 사용.
 *
 * sessionStorage 에 저장 (탭 종료 시 휘발). /letter/sent 직접 진입 시 없으면
 * 안내 + /letter/compose 진입 버튼.
 */
export type LastSentLetter = {
  body: string;
  location?: {
    label?: string;
    regionCode?: string;
  };
  sentAt: string; // ISO
  isAnonymous?: boolean;
};

interface LetterStoreState {
  lastSent: LastSentLetter | null;
  setLastSent: (sent: LastSentLetter) => void;
  clearLastSent: () => void;
}

export const useLetterStore = create<LetterStoreState>()(
  persist(
    (set) => ({
      lastSent: null,
      setLastSent: (lastSent) => set({ lastSent }),
      clearLastSent: () => set({ lastSent: null }),
    }),
    {
      // 2026-06-14: 'letter' → 'tripbite.letter' (prefix 통일).
      // 다른 라이브러리/3rd-party storage key 와의 충돌 위험 제거. auth-store 의
      // 'tripbite.auth' 패턴과 일관. 기존 사용자의 'letter' 키는 사용 안 됨
      // (lastSent 가 휘발성 UX 신호라 마이그 없음 — 사용자가 letter/sent 재진입 시
      // 정상 동작).
      name: 'tripbite.letter',
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : sessionStorage,
      ),
      partialize: (state) => ({ lastSent: state.lastSent }),
    },
  ),
);
