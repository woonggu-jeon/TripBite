'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ConceptStep } from '@/features/onboarding/components/ConceptStep';
import { LocationStep } from '@/features/onboarding/components/LocationStep';
import { NicknameStep } from '@/features/onboarding/components/NicknameStep';
import { useCompleteOnboarding } from '@/features/onboarding/hooks/use-onboarding';
import { useLocationStore } from '@/stores/location-store';
import styles from './OnboardingFlow.module.scss';

/**
 * 3-step 온보딩 상태머신
 *
 * URL은 /onboarding 하나로 유지 (뒤로가기 = step--; 첫 step에서 router.back)
 *
 * 성능:
 *   - Step 컴포넌트는 각각 features/onboarding/components 에서 import
 *   - 무거운 로직 X — 일러스트 + 약간의 폼
 */
type Step = 1 | 2 | 3;

export function OnboardingFlow() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const { mutateAsync: complete } = useCompleteOnboarding();
  const resolvedLocation = useLocationStore((s) => s.resolved);

  const goNext = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  const goPrev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  async function finishOnboarding(nickname: string) {
    // location step에서 resolve된 위치가 있으면 regionCode 함께 전달
    await complete({
      nickname,
      regionCode: resolvedLocation?.regionCode,
    });
    router.replace('/');
  }

  return (
    <div className={styles.wrap}>
      {/* 진행도 */}
      <div className={styles.progress} aria-label={`Step ${step}/3`}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`${styles.dot} ${n <= step ? styles.dotActive : ''}`}
            aria-hidden
          />
        ))}
      </div>

      <div className={styles.body}>
        {step === 1 && <ConceptStep onNext={goNext} />}
        {step === 2 && (
          <LocationStep onNext={goNext} onSkip={goNext} onPrev={goPrev} />
        )}
        {step === 3 && (
          <NicknameStep onSubmit={finishOnboarding} onPrev={goPrev} />
        )}
      </div>

      {/* TODO: t('skip') / t('next') 등 공통 라벨은 features/onboarding/components 내부에서 사용 */}
      <p style={{ fontSize: 0, position: 'absolute', opacity: 0 }}>
        {t('title')}
      </p>
    </div>
  );
}
