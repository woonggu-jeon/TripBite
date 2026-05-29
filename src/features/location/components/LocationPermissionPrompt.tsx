'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
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
      <MapPin size={28} className={styles.icon} />
      <h3 id="loc-perm-title" className={styles.title}>
        {t('title')}
      </h3>
      <p className={styles.description}>{t('description')}</p>
      <div className={styles.actions}>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            {t('skip')}
          </Button>
        )}
        <Button variant="primary" onClick={onAccept}>
          {t('request')}
        </Button>
      </div>
    </div>
  );
}
