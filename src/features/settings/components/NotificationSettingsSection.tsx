'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import {
  useUserSettings,
  useUpdateNotificationSettings,
} from '@/features/settings/hooks/use-notification-settings';
// 푸시 알림 토글 미노출 (사용자 요청, 재노출 대비 hook 유지).
// import { usePushNotification } from '@/features/notification/hooks/use-push-notification';
import { Toggle } from '@/components/forms/Toggle';
import styles from './SettingsRows.module.scss';

/**
 * 알림 설정 섹션.
 *
 * 현재 노출: 새 편지 도착 / 좋아요 알림 (서버 settings 토글).
 * 푸시 / 인앱 토글은 미노출 (사용자 요청) — Row 만 주석 처리, 모델/저장은 그대로.
 */
export function NotificationSettingsSection() {
  const t = useTranslations('settings.notifications');
  const { data: settings } = useUserSettings();
  const { mutate: update } = useUpdateNotificationSettings();
  // 푸시 토글 미노출이므로 hook 호출도 보류 — 재노출 시 주석 해제.
  // const { enable: enablePush, disable: disablePush } = usePushNotification();
  const n = settings?.notifications;

  return (
    <div className={styles.list}>
      {/* 푸시 알림 — 미노출 (사용자 요청). 추후 복원 시 주석 해제.
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
      */}
      {/* 인앱 알림 — 미노출 (사용자 요청). 추후 복원 시 주석 해제.
      <Row
        label={t('inApp')}
        hint={t('inAppHint')}
        checked={!!n?.inAppEnabled}
        onChange={(next) => update({ inAppEnabled: next })}
      />
      */}
      {/* 시안 `row` 는 제목 아래 보조 설명 한 줄이 있다 (행 73px) */}
      <Row
        label={t('letterReceived')}
        hint={t('letterReceivedHint')}
        checked={!!n?.letterReceived}
        onChange={(next) => update({ letterReceived: next })}
      />
      <Row
        label={t('letterLiked')}
        hint={t('letterLikedHint')}
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
