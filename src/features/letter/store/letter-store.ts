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
      name: 'letter',
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
