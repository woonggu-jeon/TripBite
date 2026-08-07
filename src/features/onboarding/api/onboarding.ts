import { api } from '@/services/api/client';
import type { CompleteOnboardingRequest } from '@/features/onboarding/types';

/**
 * 온보딩 완료 — POST /me/complete-onboarding { nickname?, homeRegion? }.
 *
 * ⚠️ Spring BE 미지원 (swagger 에 없음) — MSW mock 으로만 동작.
 *    실 BE 연동은 BE 가 엔드포인트 추가해야 함 (BE_REQUEST 문서 참조).
 *    호출 후 OnboardingFlow 가 `tripbite.visited` cookie set + navigate.
 */
export const onboardingApi = {
  complete: async (data: CompleteOnboardingRequest) => {
    const res = await api.post('/me/complete-onboarding', data);
    return res.data;
  },
};
