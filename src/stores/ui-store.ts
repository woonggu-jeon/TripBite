import { create } from 'zustand';

/**
 * 전역 UI 상태 — modal / toast / confirm / theme
 *
 * 원칙 (아키텍처 문서 7번):
 *   - 서버 데이터 X (TanStack Query 가 담당)
 *   - 가벼운 UI 상태만
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

type UIState = {
  theme: 'light' | 'dark' | 'system';
  modal: { key: ModalKey; payload?: unknown };
  toasts: Toast[];
  /** 동시에 여러 confirm 호출 시 큐 (보통은 1개) */
  confirms: ConfirmRequest[];
};

type UIActions = {
  setTheme: (theme: UIState['theme']) => void;
  openModal: (key: Exclude<ModalKey, null>, payload?: unknown) => void;
  closeModal: () => void;
  pushToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  pushConfirm: (req: Omit<ConfirmRequest, 'id'>) => string;
  resolveConfirm: (id: string, ok: boolean) => void;
};

export const useUIStore = create<UIState & UIActions>((set, get) => ({
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
}));
