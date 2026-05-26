'use client';

import { useTranslations } from 'next-intl';
import { useInstallPrompt } from '@/features/pwa/hooks/use-install-prompt';
import { track } from '@/features/analytics';
import styles from './Banner.module.scss';

/**
 * <InstallPromptBanner />
 *
 * "홈 화면에 추가하기" 안내 배너.
 *
 * 정책:
 *   - 첫 진입에 즉시 X (거부 시 다시 못 띄움)
 *   - useInstallPrompt 가 beforeinstallprompt 캡처만 함
 *   - 이 컴포넌트는 보일 조건을 추가로 확인 (engaged 등)
 *
 * 현재는 단순히 canInstall && !dismissed 면 노출.
 * 추후 "토너먼트 1회 완료 후" 같은 조건 도입 가능.
 */
export function InstallPromptBanner() {
  const t = useTranslations('pwa.install');
  const { canInstall, install, dismiss, dismissed } = useInstallPrompt();

  if (!canInstall || dismissed) return null;

  return (
    <div className={styles.banner} role="status">
      <span className={styles.message}>{t('description')}</span>
      <button
        type="button"
        className={styles.action}
        onClick={async () => {
          const outcome = await install();
          if (outcome === 'accepted') track('app.installed');
        }}
      >
        {t('install')}
      </button>
      <button
        type="button"
        aria-label={t('later')}
        onClick={dismiss}
        style={{ color: 'inherit', padding: '0 6px', opacity: 0.7 }}
      >
        ✕
      </button>
    </div>
  );
}
