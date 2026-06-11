'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Heart, Trophy, Bell, ShieldAlert, Send } from 'lucide-react';
import { SubHeader } from '@/components/layout/SubHeader';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import {
  useNotificationInboxInfinite,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/features/notification/hooks/use-notification-inbox';
import { usePushNotification } from '@/features/notification/hooks/use-push-notification';
import {
  canUsePushOnIOS,
  isIOS,
  isPushSupported,
} from '@/features/notification/utils/subscription';
import type {
  AppNotification,
  NotificationType,
} from '@/features/notification/types';
import styles from './NotificationsClient.module.scss';

const PUSH_PROMPT_DISMISS_KEY = 'tripbite.push-prompt.dismissed';

/**
 * type 별 아이콘 매핑.
 * unknown type 은 `?? Bell` 로 fallback (스키마 확장 전 BE 응답 호환).
 */
const TYPE_ICON: Record<NotificationType, typeof Mail> = {
  'letter.received': Mail,
  'letter.liked': Heart,
  // 보낸 편지가 누군가에게 도착 완료 — 발신자에게 알림.
  'letter.delivered': Send,
  'tournament.shared': Trophy,
  // 충북 마스터 달성 / 우승지 저장 한도 등은 BE 가 event type + 차별화된 link 로 발행.
  event: Bell,
  security: ShieldAlert,
};

export function NotificationsClient() {
  const t = useTranslations('notification');
  const tCommon = useTranslations('common');
  const {
    items,
    unreadCount,
    hasNext,
    isFetchingNext,
    fetchNext,
    isLoading,
    error,
    refetch,
  } = useNotificationInboxInfinite();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  if (error) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <EmptyState
            icon={<Bell size={28} aria-hidden />}
            title={t('error')}
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SubHeader
        title={t('title')}
        rightSlot={
          unreadCount > 0 ? (
            <button
              type="button"
              className={styles.allRead}
              onClick={() => markAllRead()}
            >
              {t('markAllRead')}
            </button>
          ) : null
        }
      />
      <div className={styles.wrap}>
        <PushPrompt />

        {isLoading && items.length === 0 ? (
          <div className={styles.skeletonList} aria-label={tCommon('loading')}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonItem}>
                <Skeleton width={32} height={32} radius="full" />
                <div className={styles.skeletonLines}>
                  <Skeleton width="80%" height={14} radius="sm" />
                  <Skeleton width="55%" height={12} radius="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InfiniteList
            items={items}
            hasNext={hasNext}
            isFetchingNext={isFetchingNext}
            onReachEnd={fetchNext}
            keyExtractor={(n) => n.id}
            renderItem={(n) => (
              <Item
                n={n}
                onSelect={() => {
                  if (!n.read) markRead(n.id);
                }}
              />
            )}
            emptyState={
              <EmptyState
                icon={<Mail size={28} aria-hidden />}
                title={t('empty')}
              />
            }
          />
        )}
      </div>
    </>
  );
}

/**
 * 푸시 권한 prompt — 알림 페이지 상단 inline.
 *
 * 노출 조건:
 *   - Notification.permission === 'default'
 *   - 사용자가 X 로 닫지 않음 (localStorage)
 *   - 브라우저가 push 지원
 *
 * iOS 분기: standalone(홈 추가) 아니면 권한 요청 silent fail — enable 비활성 + 안내만.
 */
function PushPrompt() {
  const t = useTranslations('notification.push');
  const { enable, status } = usePushNotification();
  const [show, setShow] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!(await isPushSupported())) return;
      if (typeof window === 'undefined') return;
      if (Notification.permission !== 'default') return;
      if (window.localStorage.getItem(PUSH_PROMPT_DISMISS_KEY) === 'true')
        return;
      setIosNeedsInstall(isIOS() && !canUsePushOnIOS());
      setShow(true);
    })();
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(PUSH_PROMPT_DISMISS_KEY, 'true');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const handleEnable = async () => {
    if (iosNeedsInstall) return;
    await enable();
    dismiss();
  };

  return (
    <div className={styles.pushPrompt}>
      <p className={styles.pushPromptText}>{t('text')}</p>
      {iosNeedsInstall && (
        <p className={styles.pushPromptHint}>{t('iosInstallHint')}</p>
      )}
      <div className={styles.pushPromptActions}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={handleEnable}
          disabled={iosNeedsInstall}
          loading={status === 'requesting'}
        >
          {iosNeedsInstall
            ? t('iosCta')
            : status === 'requesting'
              ? t('requesting')
              : t('enable')}
        </Button>
        <Button variant="secondary" size="sm" onClick={dismiss}>
          {t('dismiss')}
        </Button>
      </div>
    </div>
  );
}

function Item({ n, onSelect }: { n: AppNotification; onSelect: () => void }) {
  const Icon = TYPE_ICON[n.type] ?? Bell;
  const message = n.body ?? n.title;
  const body = (
    <div className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
      <Icon size={18} className={styles.icon} aria-hidden />
      <div className={styles.itemMessage}>{message}</div>
    </div>
  );

  if (n.link) {
    // BE 가 `/letters` (복수) 잘못된 path 보내는 안전망 — FE 페이지는 `/letter` 단수.
    // BE 측 정합 fix 가 정답이지만 (`/letters?tab=sent` → `/letter?tab=sent`),
    // 운영 알림이 404 로 가지 않도록 normalize.
    const normalized = n.link.replace(/^\/letters(?=[/?#]|$)/, '/letter');
    return (
      <Link
        href={normalized as React.ComponentProps<typeof Link>['href']}
        prefetch={false}
        onClick={onSelect}
        className={styles.link}
      >
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onSelect} className={styles.link}>
      {body}
    </button>
  );
}
