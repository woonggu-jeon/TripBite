'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Checkbox } from '@/components/forms/Checkbox';
import { Button } from '@/components/ui';
import styles from './OnboardingStep.module.scss';

/**
 * <AgeConfirmStep /> — 온보딩 만 14세 확인 step.
 *
 * 정보통신망법 / 개인정보보호법 기준 만 14세 미만 가입 제한.
 * 체크박스로 "만 14세 이상" 자기 확인 — 미체크 시 다음 disabled.
 *
 * 디바이스 onboarding 신호는 tripbite.visited cookie (middleware 가 보는 source) —
 * 다음 단계 진입 시 implicit 처리 (별 key 안 둠 — onboarded 자체가 14세 확인 후 완료된 신호).
 */
export function AgeConfirmStep({
  onNext,
  onPrev,
}: {
  onNext?: () => void;
  onPrev?: () => void;
}) {
  const t = useTranslations('onboarding.age');
  const tCommon = useTranslations('onboarding');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className={styles.step}>
      <div className={styles.emoji} aria-hidden>
        🪪
      </div>
      {/* a11y: 온보딩 스텝은 한 번에 하나만 렌더 → 화면 주제목이므로 h1
          (page-has-heading-one, WCAG). 스타일은 .title 클래스라 시각 변화 없음. */}
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.description}>{t('description')}</p>

      <label className={styles.consent}>
        <Checkbox
          checked={confirmed}
          onChange={setConfirmed}
          ariaDescribedBy="age-confirm-hint"
        />
        <span>{t('confirmLabel')}</span>
      </label>
      <p id="age-confirm-hint" className={styles.hint}>
        {t('hint')}
      </p>

      <div className={styles.actions}>
        {onPrev && (
          <Button variant="ghost" size="lg" onClick={onPrev}>
            {tCommon('back')}
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNext}
          disabled={!confirmed}
        >
          {tCommon('next')}
        </Button>
      </div>
    </div>
  );
}
