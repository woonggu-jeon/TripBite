/**
 * Onboarding feature — Public API
 *
 * 진입 흐름:
 *   /login 성공 → AuthBootstrap 이 /me 조회 →
 *   user.isOnboarded === false → router.replace('/onboarding')
 *
 * 완료 시:
 *   POST /me/complete-onboarding { nickname, regionCode? }
 *   → /me invalidate → AuthBootstrap이 isOnboarded=true 받음 → router.replace('/')
 */
export { onboardingApi } from './api/onboarding';
export { useCompleteOnboarding } from './hooks/use-onboarding';
export { ConceptStep } from './components/ConceptStep';
export { LocationStep } from './components/LocationStep';
export { NicknameStep } from './components/NicknameStep';
export type {
  OnboardingState,
  CompleteOnboardingRequest,
} from './types';
