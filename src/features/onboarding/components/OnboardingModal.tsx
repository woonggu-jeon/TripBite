'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useKeyboard } from '@/hooks/use-keyboard';
import { haptic } from '@/lib/haptic';
import { localOnboarding } from '@/features/onboarding/hooks/use-local-onboarding';
import styles from './OnboardingModal.module.scss';

/**
 * 첫 진입자 환영 modal — 사이트 어느 페이지든 자동 1회 표시.
 *
 * 정책 (AUTH_FLOWS / AuthBootstrap 의 onboarding 자동 redirect 폐기 후 대체):
 *   - localStorage `tripbite.onboarded === true` 면 표시 X
 *   - 페이지 진입 후 짧은 delay (300ms) 로 자연스럽게 fade-in
 *   - close / cta 모두 localStorage 저장 — 다음 진입부터 표시 X
 *   - "자세히 보기" → /onboarding (기존 3-step 페이지) 진입
 *   - 비로그인 자유 진입 정책 유지 — 사용자가 닫으면 그 페이지 그대로
 *
 * Providers 안에 한 번 mount.
 */
const REVEAL_DELAY_MS = 300;

export function OnboardingModal() {
  const t = useTranslations('onboarding.welcomeModal');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SSR 안전 — mount 후 1회 localStorage 검사.
    // 이미 본 사용자는 modal 자체를 mount 안 함 (DOM 부담 0).
    if (localOnboarding.read()) return;
    const id = window.setTimeout(() => setOpen(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  useFocusTrap(ref, open);
  useKeyboard('Escape', () => handleClose(), { enabled: open });

  function persistSeen() {
    localOnboarding.write(true);
  }

  function handleClose() {
    haptic.tap();
    persistSeen();
    setOpen(false);
  }

  function handleStart() {
    haptic.tap();
    persistSeen();
    setOpen(false);
  }

  function handleDetail() {
    haptic.tap();
    persistSeen();
    setOpen(false);
    router.push('/onboarding');
  }

  if (!open) return null;

  return (
    // backdrop click = close
    <div className={styles.backdrop} role="presentation" onClick={handleClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t('ariaLabel')}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={20} aria-hidden />
        </button>

        <h2 className={styles.title}>{t('title')}</h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <ul className={styles.features}>
          <li>{t('feature1')}</li>
          <li>{t('feature2')}</li>
          <li>{t('feature3')}</li>
        </ul>

        <div className={styles.actions}>
          <Button variant="ghost" fullWidth onClick={handleDetail}>
            {t('detailCta')}
          </Button>
          <Button variant="primary" fullWidth onClick={handleStart}>
            {t('cta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
