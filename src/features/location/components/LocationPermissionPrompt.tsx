'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
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
}: {
  onAccept: () => void;
  onSkip?: () => void;
}) {
  const t = useTranslations('location.permission');

  return (
    <div
      className={styles.prompt}
      role="dialog"
      aria-labelledby="loc-perm-title"
    >
      {/* Figma 위치 권한 동의 hero — 116px SVG icon. lucide MapPin 대체. */}
      <Image
        src="/images/auth/location-hero.svg"
        alt=""
        width={116}
        height={116}
        className={styles.icon}
        priority
      />
      <h3 id="loc-perm-title" className={styles.title}>
        {t('title')}
      </h3>
      <p className={styles.description}>{t('description')}</p>
      {/* Figma button stack — column gap 11px. primary 위 / skip 아래. */}
      <div className={styles.actions}>
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
