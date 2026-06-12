import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { OnboardingFlow } from './_components/OnboardingFlow';
import { AuthLayout } from '@/components/layout/AuthLayout';

/**
 * 온보딩 페이지 (/onboarding)
 *
 * 진입 조건:
 *   - middleware 가 `tripbite.visited` cookie 없는 디바이스 → 본 페이지로 redirect
 *   - 인증 무관 (디바이스 단위 onboarding). 비로그인 사용자도 진입 가능 — 가입 유도
 *
 * 3 step 단일 페이지 (URL 그대로, 내부 step 상태):
 *   1) 컨셉 소개 — 앱이 뭘 하는지 3-4줄 + 일러스트
 *   2) 위치 권한 요청 — LocationPermissionPrompt 사용
 *      허용 → resolve 후 위치 저장
 *      건너뛰기 → 다음 단계 (편지 작성 시 다시 권한 요청)
 *   3) 닉네임 입력 — 1~10자, useUpdateNickname
 *      완료 → PATCH /mypage/profile + POST /me/complete-onboarding
 *      → router.replace('/')
 *
 * 헤더/네비 없음 ((auth) 그룹).
 * 뒤로가기 / 진행도 indicator는 OnboardingFlow 내부에서 처리.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('onboarding');
  return { title: t('title') };
}

export default async function OnboardingPage() {
  // 이미 끝낸 사용자가 /onboarding 직접 URL 입력 시 — SSR 단계에서 / 로 보냄 (FOUC 0).
  const c = await cookies();
  if (c.get('tripbite.visited')?.value === '1') redirect('/');

  return (
    <AuthLayout variant="column">
      <OnboardingFlow />
    </AuthLayout>
  );
}
