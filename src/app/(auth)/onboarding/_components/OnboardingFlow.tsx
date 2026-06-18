'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConceptStep } from '@/features/onboarding/components/ConceptStep';
// 만 14세 확인 step 미노출 (사용자 요청, 2026-06-18). 정보통신망법 / 개인정보보호법
// 정책 재논의 시 복원 가능 — 아래 step 2 분기 + TOTAL_STEPS 만 되돌리면 됨.
// import { AgeConfirmStep } from '@/features/onboarding/components/AgeConfirmStep';
import { LocationStep } from '@/features/onboarding/components/LocationStep';
import { useCompleteOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { useAuthStore } from '@/stores/auth-store';
import { useLocationStore } from '@/stores/location-store';
import styles from './OnboardingFlow.module.scss';

/**
 * 2-step 온보딩 상태머신 (닉네임 / 만 14세 step 모두 미노출)
 *
 * URL은 /onboarding 하나로 유지 (뒤로가기 = step--; 첫 step에서 router.back)
 *
 * 흐름: ConceptStep(1) → LocationStep(2)
 *
 * 변경 이력:
 *   - 닉네임 단계 미노출 — 서버가 기본 닉네임 자동 부여 가정. `NicknameStep` 보존.
 *   - 만 14세 확인 step 미노출 (2026-06-18) — 정책 재논의 시 복원. AgeConfirmStep
 *     컴포넌트 / i18n 키 보존. 복원 절차: AgeConfirmStep import 살리고 step 2/3
 *     분기 + TOTAL_STEPS = 3.
 *   - LocationStep 완료/건너뛰기 시 즉시 finishOnboarding 호출.
 *   - nickname 은 빈 문자열로 전송 — mock handler / 실 백엔드가 누락 시 기본값 사용.
 */
type Step = 1 | 2;
const TOTAL_STEPS = 2;

export function OnboardingFlow() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  // ?next= 가 있으면 onboarding 끝난 후 그 경로로 (deep-link / 공유 링크 보존).
  // open-redirect 차단: `/` 시작 + `//` 아닌 경로만 (auth 의 redirect 와 동일 정책).
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next');
  const safeNext =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : '/';
  const [step, setStep] = useState<Step>(1);
  const { mutateAsync: complete, isPending } = useCompleteOnboarding();
  const resolvedLocation = useLocationStore((s) => s.resolved);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const goNext = () =>
    setStep((s) => (s < TOTAL_STEPS ? ((s + 1) as Step) : s));
  const goPrev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  async function finishOnboarding() {
    if (isPending) return;
    // 디바이스 신호 — middleware 가 다음 진입부터 SSR 단계에서 skip 판정 (FOUC 회피).
    // 1년 max-age, SameSite=Lax (same-site 충분, cross-origin 진입 무관).
    // HttpOnly 아님 — 디바이스 UX 신호. 인증은 SID cookie 별도.
    if (typeof document !== 'undefined') {
      document.cookie =
        'tripbite.visited=1; max-age=31536000; path=/; SameSite=Lax';
    }
    // 인증 사용자만 백엔드 onboarding API 호출 (비인증 사용자는 로그인 후 별도).
    if (isAuthenticated) {
      await complete({
        regionCode: resolvedLocation?.regionCode,
      });
    }
    router.replace(safeNext as Parameters<typeof router.replace>[0]);
  }

  return (
    <div className={styles.wrap}>
      {/* 진행도 */}
      <div
        className={styles.progress}
        aria-label={`Step ${step}/${TOTAL_STEPS}`}
      >
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const n = i + 1;
          return (
            <span
              key={n}
              className={`${styles.dot} ${n <= step ? styles.dotActive : ''}`}
              aria-hidden
            />
          );
        })}
      </div>

      <div className={styles.body}>
        {step === 1 && <ConceptStep onNext={goNext} />}
        {/* step === 2 (이전 AgeConfirmStep 자리) — 만 14세 확인 미노출. 복원 시:
            {step === 2 && <AgeConfirmStep onNext={goNext} onPrev={goPrev} />}
            {step === 3 && <LocationStep ... />} 로 되돌리고 TOTAL_STEPS = 3. */}
        {step === 2 && (
          <LocationStep
            onNext={finishOnboarding}
            onSkip={finishOnboarding}
            onPrev={goPrev}
          />
        )}
      </div>

      <p style={{ fontSize: 0, position: 'absolute', opacity: 0 }}>
        {t('title')}
      </p>
    </div>
  );
}
