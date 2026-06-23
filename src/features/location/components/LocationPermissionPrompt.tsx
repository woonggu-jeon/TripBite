'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import styles from './LocationPermissionPrompt.module.scss';

/**
 * <LocationPermissionPrompt />
 *
 * 권한 요청 전 사용자에게 맥락을 설명하는 UI.
 *
 * 왜 필요한가:
 *   - 브라우저 prompt만 띄우면 사용자가 맥락을 모르고 거부할 가능성 높음
 *   - 거부하면 다시 요청이 어려움 (browser 정책)
 *   - 사전 안내 → 사용자가 "허용" 버튼을 의도적으로 누르도록 함
 *
 * 사용:
 *   const [showPrompt, setShowPrompt] = useState(true);
 *   <LocationPermissionPrompt
 *     onAccept={() => { setShowPrompt(false); resolveLocation(); }}
 *     onSkip={() => setShowPrompt(false)}
 *   />
 */
export function LocationPermissionPrompt({
  onAccept,
  onSkip,
  progress,
}: {
  onAccept: () => void;
  onSkip?: () => void;
  /** Onboarding 안에서 사용 시 dots 표시 (button 바로 위). 단독 사용 시 생략. */
  progress?: { current: number; total: number };
}) {
  const t = useTranslations('location.permission');

  return (
    <div
      className={styles.prompt}
      role="dialog"
      aria-labelledby="loc-perm-title"
    >
      {/* Figma "circle/location" (3378:266) — 96x96. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/auth/location-hero.svg"
        alt=""
        width={96}
        height={96}
        className={styles.icon}
      />
      <h3 id="loc-perm-title" className={styles.title}>
        {t('title')}
      </h3>
      <p className={styles.description}>{t('description')}</p>
      {/* Figma button stack — column gap 11px. primary 위 / skip 아래.
          onboarding 안에선 dots progress 가 허용 button 바로 위. */}
      <div className={styles.actions}>
        {progress && (
          <OnboardingProgress
            current={progress.current}
            total={progress.total}
          />
        )}
        <Button variant="primary" size="lg" fullWidth onClick={onAccept}>
          {t('request')}
        </Button>
        {onSkip && (
          <Button variant="ghost" size="lg" fullWidth onClick={onSkip}>
            {t('skip')}
          </Button>
        )}
      </div>
    </div>
  );
}
