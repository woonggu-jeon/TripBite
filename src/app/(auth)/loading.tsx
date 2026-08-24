import { SplashScreen } from '@/features/auth/components/SplashScreen';

/**
 * (auth) 그룹 cold start fallback — `/login`, `/signup`, `/find-id`,
 * `/forgot-password`, `/reset-password`, `/onboarding` 진입 시.
 *
 * 시안의 SPLASH 를 그대로 쓴다 — 로그인 직전에 보이는 화면이 시안 흐름과
 * 일치한다. (구: 제목 + input 2개 + 버튼 형태의 스켈레톤)
 */
export default function AuthLoading() {
  return <SplashScreen />;
}
