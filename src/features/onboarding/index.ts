/**
 * Onboarding feature — Public API
 *
 * 진입 흐름:
 *   middleware 가 `tripbite.visited` cookie 없는 디바이스 → /onboarding 으로 SSR redirect.
 *   원래 가려던 path 는 ?next= 로 보존.
 *
 * 완료 시:
 *   POST /me/complete-onboarding { nickname, regionCode? }
 *   → OnboardingFlow 가 `tripbite.visited=1` cookie set 후 ?next= 경로로 router.replace.
 */
export { onboardingApi } from './api/onboarding';
export { useCompleteOnboarding } from './hooks/use-onboarding';
export { ConceptStep } from './components/ConceptStep';
export { AgeConfirmStep } from './components/AgeConfirmStep';
export { LocationStep } from './components/LocationStep';
export { NicknameStep } from './components/NicknameStep';
export type { OnboardingState, CompleteOnboardingRequest } from './types';
