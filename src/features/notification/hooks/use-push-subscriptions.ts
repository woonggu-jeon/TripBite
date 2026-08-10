'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthedQueryEnabled } from '@/features/auth/hooks/use-authed-query';
import { notificationApi } from '@/features/notification/api/notification';
import { CACHE } from '@/lib/cache';

export const pushSubscriptionKeys = {
  all: ['push-subscriptions'] as const,
};

/**
 * 계정에 등록된 Web Push 구독 기기 목록 — GET /notifications/subscriptions.
 * 로그인 상태에서만 조회.
 */
export function usePushSubscriptions() {
  const enabled = useAuthedQueryEnabled();
  return useQuery({
    queryKey: pushSubscriptionKeys.all,
    queryFn: () => notificationApi.listSubscriptions(),
    enabled,
    ...CACHE.user,
  });
}

/**
 * 특정 구독 기기 해제 — DELETE /notifications/subscriptions/{id}.
 * 성공 시 목록 무효화.
 */
export function useRemovePushSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.removeSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pushSubscriptionKeys.all });
    },
  });
}
