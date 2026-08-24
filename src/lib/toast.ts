'use client';

import { type ToastType, useUIStore } from '@/stores/ui-store';

/**
 * 간단한 imperative toast API
 *
 * 사용:
 *   toast.success('저장되었어요');
 *   toast.error('실패했어요');
 *
 * 화면에 표시되는 부분은 <Toaster /> 컴포넌트가 담당 (Providers 안에 마운트).
 *
 * sonner 등 라이브러리 도입 시:
 *   이 파일을 sonner adapter 로 교체하면 호출부 변경 없음.
 */
type ToastOptions = { duration?: number };

function show(
  type: ToastType,
  message: string,
  options?: ToastOptions,
): string {
  return useUIStore.getState().pushToast({
    type,
    message,
    duration: options?.duration ?? (type === 'error' ? 5000 : 3000),
  });
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    show('success', message, options),
  error: (message: string, options?: ToastOptions) =>
    show('error', message, options),
  info: (message: string, options?: ToastOptions) =>
    show('info', message, options),
  warning: (message: string, options?: ToastOptions) =>
    show('warning', message, options),
  dismiss: (id: string) => useUIStore.getState().dismissToast(id),
};
