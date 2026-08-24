import { updateMe as beUpdateMe } from '@/api/be/me/me';
import type { CompleteOnboardingRequest } from '@/features/onboarding/types';

/**
 * 온보딩 완료 — 4-A 전환: complete-onboarding 미지원 → PATCH /me { nickname }.
 *
 * 온보딩은 원래 device 신호(방문 여부)라, 완료 표식은 OnboardingFlow 가
 * `tripbite.visited` cookie 로 관리한다. 서버엔 닉네임만 반영(있을 때).
 * homeRegion/regionCode 는 Spring me 스키마에 없어 미반영.
 */
export const onboardingApi = {
  complete: async (data: CompleteOnboardingRequest) => {
    const nickname = data.nickname?.trim();
    // 닉네임 단계가 미노출이면 patch 할 값이 없음 — no-op (visited cookie 로 완료 처리).
    if (!nickname) return null;
    const res = await beUpdateMe({ nickname });
    return res.data;
  },
};
