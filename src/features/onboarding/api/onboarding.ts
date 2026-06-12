import { onboardingControllerCompleteV1 } from '@/api/generated/onboarding/onboarding';
import type { CompleteOnboardingRequest } from '@/features/onboarding/types';

/**
 * 온보딩 완료 — orval generated client wrap.
 *
 *   POST /me/complete-onboarding { nickname?, homeRegion? } → User (isOnboarded:true)
 *
 * 호출 후 OnboardingFlow 가 `tripbite.visited` cookie set + 다음 경로로 navigate.
 * server user 변경은 다음 ProfileCard mount 시 useMe refetch 에서 반영.
 */
export const onboardingApi = {
  complete: (data: CompleteOnboardingRequest) =>
    onboardingControllerCompleteV1(data),
};
