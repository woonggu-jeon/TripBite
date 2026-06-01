import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 전역 UI 상태 — modal / toast / confirm / theme
 *
 * 원칙 (아키텍처 문서 7번):
 *   - 서버 데이터 X (TanStack Query 가 담당)
 *   - 가벼운 UI 상태만
 *
 * theme 만 localStorage persist — 사용자 선택 (light/dark/system) 유지.
 * 그 외 (modal/toasts/confirms) 는 휘발성.
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  /** 자동 사라짐 (ms). undefined = 영구 */
  duration?: number;
};

export type ConfirmRequest = {
  id: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** 약속 resolve — useConfirm 훅이 자동 처리 */
  resolve: (ok: boolean) => void;
};

export type ModalKey = 'profile' | null;

export type ThemeMode = 'light' | 'dark' | 'system';

type UIState = {
  theme: ThemeMode;
  modal: { key: ModalKey; payload?: unknown };
  toasts: Toast[];
  /** 동시에 여러 confirm 호출 시 큐 (보통은 1개) */
  confirms: ConfirmRequest[];
};

type UIActions = {
  setTheme: (theme: ThemeMode) => void;
  openModal: (key: Exclude<ModalKey, null>, payload?: unknown) => void;
  closeModal: () => void;
  pushToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  pushConfirm: (req: Omit<ConfirmRequest, 'id'>) => string;
  resolveConfirm: (id: string, ok: boolean) => void;
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      theme: 'system',
      modal: { key: null },
      toasts: [],
      confirms: [],

      setTheme: (theme) => set({ theme }),

      openModal: (key, payload) => set({ modal: { key, payload } }),
      closeModal: () => set({ modal: { key: null } }),

      pushToast: (toast) => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        return id;
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      pushConfirm: (req) => {
        const id = crypto.randomUUID();
        set((s) => ({ confirms: [...s.confirms, { ...req, id }] }));
        return id;
      },
      resolveConfirm: (id, ok) => {
        const item = get().confirms.find((c) => c.id === id);
        item?.resolve(ok);
        set((s) => ({ confirms: s.confirms.filter((c) => c.id !== id) }));
      },
    }),
    {
      name: 'tripbite.ui',
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : localStorage,
      ),
      // theme 만 persist — 휘발성 UI 상태 (modal/toasts/confirms) 는 제외.
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
