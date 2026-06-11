'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ConceptStep } from '@/features/onboarding/components/ConceptStep';
import { AgeConfirmStep } from '@/features/onboarding/components/AgeConfirmStep';
import { LocationStep } from '@/features/onboarding/components/LocationStep';
import { useCompleteOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { useLocalOnboarding } from '@/features/onboarding/hooks/use-local-onboarding';
import { useAuthStore } from '@/stores/auth-store';
import { useLocationStore } from '@/stores/location-store';
import styles from './OnboardingFlow.module.scss';

/**
 * 3-step 온보딩 상태머신 (닉네임 step 미노출)
 *
 * URL은 /onboarding 하나로 유지 (뒤로가기 = step--; 첫 step에서 router.back)
 *
 * 흐름: ConceptStep(1) → AgeConfirmStep(2, 만 14세 확인) → LocationStep(3)
 *
 * 변경 이력:
 *   - 닉네임 단계는 일단 미노출 — 서버가 기본 닉네임을 자동 부여 가정.
 *     `NicknameStep` 컴포넌트 / `nicknameSchema` 자체는 보존되어 추후 재노출 가능.
 *   - 만 14세 확인 step 추가 (정보통신망법 / 개인정보보호법) — 미체크 시 다음 disabled.
 *   - step 3 (LocationStep) 완료/건너뛰기 시 즉시 finishOnboarding 호출.
 *   - nickname 은 빈 문자열로 전송 — mock handler / 실 백엔드가 누락 시 기본값 사용.
 */
type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;

export function OnboardingFlow() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const { mutateAsync: complete, isPending } = useCompleteOnboarding();
  const resolvedLocation = useLocationStore((s) => s.resolved);
  const { markCompleted } = useLocalOnboarding();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const goNext = () =>
    setStep((s) => (s < TOTAL_STEPS ? ((s + 1) as Step) : s));
  const goPrev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  async function finishOnboarding() {
    if (isPending) return;
    // localStorage 마킹은 인증/비인증 양쪽 모두 — 디바이스 단위로 다음 진입 시 skip.
    markCompleted();
    // 인증 사용자만 백엔드 onboarding API 호출 (비인증 사용자는 로그인 후 별도).
    if (isAuthenticated) {
      await complete({
        regionCode: resolvedLocation?.regionCode,
      });
    }
    router.replace('/');
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
        {step === 2 && <AgeConfirmStep onNext={goNext} onPrev={goPrev} />}
        {step === 3 && (
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
