'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import {
  useUserSettings,
  useUpdateNotificationSettings,
} from '@/features/settings/hooks/use-notification-settings';
import { usePushNotification } from '@/features/notification/hooks/use-push-notification';
import { Toggle } from '@/components/forms/Toggle';
import styles from './SettingsRows.module.scss';

/**
 * 알림 설정 섹션 — 4개 ARIA switch 토글.
 *
 * 푸시 토글:
 *   - on  → enablePush() (브라우저 권한 + subscribe) + 서버 settings 저장
 *   - off → disablePush() + 서버 settings 저장
 */
export function NotificationSettingsSection() {
  const t = useTranslations('settings.notifications');
  const { data: settings } = useUserSettings();
  const { mutate: update } = useUpdateNotificationSettings();
  const { enable: enablePush, disable: disablePush } = usePushNotification();
  const n = settings?.notifications;

  return (
    <div className={styles.list}>
      <Row
        label={t('push')}
        hint={t('pushHint')}
        checked={!!n?.pushEnabled}
        onChange={async (next) => {
          if (next) await enablePush();
          else await disablePush();
          update({ pushEnabled: next });
        }}
      />
      <Row
        label={t('inApp')}
        hint={t('inAppHint')}
        checked={!!n?.inAppEnabled}
        onChange={(next) => update({ inAppEnabled: next })}
      />
      <Row
        label={t('letterReceived')}
        checked={!!n?.letterReceived}
        onChange={(next) => update({ letterReceived: next })}
      />
      <Row
        label={t('letterLiked')}
        checked={!!n?.letterLiked}
        onChange={(next) => update({ letterLiked: next })}
      />
    </div>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const labelId = useId();
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <div id={labelId} className={styles.rowLabel}>
          {label}
        </div>
        {hint && <div className={styles.rowHint}>{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} ariaLabelledBy={labelId} />
    </div>
  );
}
