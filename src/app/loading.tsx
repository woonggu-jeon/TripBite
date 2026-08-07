import { SplashScreen } from '@/features/auth/components/SplashScreen';

/**
 * App Router 전역 로딩 UI — 라우트 전환 / 첫 셸 준비 중 자동 표시.
 *
 * Figma `auth / SPLASH` 를 여기에 붙였다. 시안 흐름의 SPLASH → LOGIN 에서
 * SPLASH 가 놓이는 자리가 웹에서는 "첫 화면이 준비되기 전" 이라서다.
 * (구: 32px 스피너)
 */
export default function Loading() {
  return <SplashScreen />;
}
