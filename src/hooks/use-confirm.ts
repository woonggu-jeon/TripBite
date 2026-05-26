'use client';

import { useUIStore, type ConfirmRequest } from '@/stores/ui-store';

/**
 * useConfirm — Promise 기반 확인 다이얼로그
 *
 * 사용:
 *   const confirm = useConfirm();
 *
 *   async function deleteLetter() {
 *     const ok = await confirm({
 *       title: '편지를 삭제할까요?',
 *       description: '이 작업은 되돌릴 수 없어요.',
 *       confirmLabel: '삭제',
 *       destructive: true,
 *     });
 *     if (!ok) return;
 *     mutate(letterId);
 *   }
 *
 * 화면 표시는 <ConfirmDialog /> 가 담당 (Providers 안에 마운트).
 *
 * 적용 권장 위치:
 *   - 회원 탈퇴
 *   - 편지 삭제
 *   - 저장된 우승지 삭제 / 교체
 *   - 차단 사용자 해제
 *   - 로그아웃 (선택)
 */
type ConfirmOptions = Omit<ConfirmRequest, 'id' | 'resolve'>;

export function useConfirm() {
  return async function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      useUIStore.getState().pushConfirm({ ...options, resolve });
    });
  };
}
