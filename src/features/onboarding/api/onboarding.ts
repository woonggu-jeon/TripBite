import { api } from '@/services/api/client';
import type { CompleteOnboardingRequest } from '@/features/onboarding/types';

/**
 * 온보딩 완료 API
 *
 * 백엔드:
 *   POST /me/complete-onboarding
 *     body: { nickname, regionCode? }
 *     → User { isOnboarded: true, nickname, ... }
 *
 * 호출 후:
 *   - /me cache invalidate
 *   - AuthBootstrap이 새 user 받아 store 업데이트
 *   - 라우터에서 / 로 이동
 */
export const onboardingApi = {
  complete: async (data: CompleteOnboardingRequest) => {
    const res = await api.post('/me/complete-onboarding', data);
    return res.data;
  },
};
