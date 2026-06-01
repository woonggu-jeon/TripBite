import { useUIStore } from '@/stores/ui-store';

/**
 * Promise 기반 confirm — `<ConfirmDialog />` (providers.tsx 에 mount) 와 연동.
 *
 * 사용:
 *   const ok = await confirm({ title, description, destructive: true });
 *   if (!ok) return;
 *
 * 동작:
 *   - ui-store 의 `confirms` 큐에 push → `<ConfirmDialog />` 가 렌더
 *   - 사용자가 확인/취소 → resolve(boolean) → Promise resolve
 *
 * 동시에 여러 confirm 호출 시 큐 처리. 보통 1개씩.
 */
export type ConfirmInput = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 위험 액션 (삭제 / 탈퇴 등) — 확인 버튼이 danger 톤 */
  destructive?: boolean;
};

export function confirm(input: ConfirmInput): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    useUIStore.getState().pushConfirm({ ...input, resolve });
  });
}
