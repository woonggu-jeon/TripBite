import { onboardingControllerCompleteV1 } from '@/api/generated/onboarding/onboarding';
import type { CompleteOnboardingRequest } from '@/features/onboarding/types';

/**
 * 온보딩 완료 — orval generated client wrap.
 *
 *   POST /me/complete-onboarding { nickname?, homeRegion? } → User (isOnboarded:true)
 *
 * 호출 후 hook 이 /me cache invalidate → AuthBootstrap 가 새 user 로 store 갱신.
 */
export const onboardingApi = {
  complete: (data: CompleteOnboardingRequest) =>
    onboardingControllerCompleteV1(data),
};
