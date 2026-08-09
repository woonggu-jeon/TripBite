'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import {
  usePushSubscriptions,
  useRemovePushSubscription,
} from '@/features/notification/hooks/use-push-subscriptions';
import styles from './SettingsRows.module.scss';

/**
 * 알림 구독 기기 관리 — GET /notifications/subscriptions 목록 + 개별 해제
 * (DELETE /notifications/subscriptions/{id}).
 *
 * 여러 기기(브라우저)에서 푸시를 구독한 경우, 계정에 등록된 구독을 확인하고
 * 원격 해제한다. 목록이 비면 섹션 자체는 안내 문구만 노출.
 */
export function PushDevicesSection() {
  const t = useTranslations('settings.devices');
  const { data: devices, isLoading } = usePushSubscriptions();
  const { mutate: remove, isPending } = useRemovePushSubscription();

  if (isLoading) return null;

  const items = devices ?? [];
  if (items.length === 0) {
    return <p className={styles.rowHint}>{t('empty')}</p>;
  }

  return (
    <div className={styles.list}>
      {items.map((d) => {
        const registered = d.createdAt
          ? new Date(d.createdAt).toLocaleDateString('ko-KR')
          : '';
        return (
          <div key={d.id} className={styles.row}>
            <div className={styles.rowText}>
              <div className={styles.rowLabel}>
                {d.userAgent || t('unknownDevice')}
              </div>
              {registered && (
                <div className={styles.rowHint}>
                  {t('registeredAt', { date: registered })}
                </div>
              )}
            </div>
            <div className={styles.rowTrailing}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => d.id != null && remove(d.id)}
                disabled={isPending}
              >
                {t('remove')}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
