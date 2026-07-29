'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  AppNotificationDto,
  AppNotificationType,
} from '@/api/generated/schemas';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Icon, type IconName } from '@/components/icon/Icon';
import { SubHeader } from '@/components/layout/SubHeader';
import { Button } from '@/components/ui';
import { InfiniteList } from '@/features/list/components/InfiniteList';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInboxInfinite,
} from '@/features/notification/hooks/use-notification-inbox';
import { usePushNotification } from '@/features/notification/hooks/use-push-notification';
import {
  canUsePushOnIOS,
  isIOS,
  isPushSupported,
} from '@/features/notification/utils/subscription';
import { relativeTimeToken } from '@/lib/relative-time';
import styles from './NotificationsClient.module.scss';

/**
 * 알림 createdAt → "방금 전 / N분 전 / N시간 전 / N일 전" 라벨. letter 와
 * 동일 i18n 키 (`letter.relativeTime`) 재사용 — 메시지 내용 동일 (한국어 의미상
 * 공통). 별도 `notification.relativeTime` 도입 가능하나 키 중복 회피.
 */
function useRelativeTime(iso: string): string {
  const t = useTranslations('letter.relativeTime');
  const tok = relativeTimeToken(iso);
  switch (tok.kind) {
    case 'justNow':
      return t('justNow');
    case 'minutes':
      return t('minutesAgo', { n: tok.value });
    case 'hours':
      return t('hoursAgo', { n: tok.value });
    case 'days':
      return t('daysAgo', { n: tok.value });
    case 'date':
      return new Date(iso).toLocaleDateString();
  }
}

const PUSH_PROMPT_DISMISS_KEY = 'tripbite.push-prompt.dismissed';

/**
 * type 별 아이콘 매핑.
 * unknown type 은 `?? Bell` 로 fallback (스키마 확장 전 BE 응답 호환).
 */
const TYPE_ICON: Record<AppNotificationType, IconName> = {
  'letter.received': 'mail',
  'letter.liked': 'heart-fill',
  // 보낸 편지가 누군가에게 도착 완료 — 발신자에게 알림.
  'letter.delivered': 'send',
  'tournament.shared': 'award',
  // 충북 마스터 달성 / 우승지 저장 한도 등은 BE 가 event type + 차별화된 link 로 발행.
  event: 'bell',
  security: 'shield-alert',
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
            icon={<Icon name="noti" size={28} />}
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
              // Figma "알림 빈 상태" (2026-06-23) — EmptyState variant=hero
              // (84 circle + primary-soft bg + primary 38 Bell + Body B_16).
              <EmptyState
                variant="hero"
                icon={<Icon name="noti" size={36} />}
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

function Item({
  n,
  onSelect,
}: {
  n: AppNotificationDto;
  onSelect: () => void;
}) {
  const iconName = TYPE_ICON[n.type] ?? 'bell';
  const time = useRelativeTime(n.createdAt);
  const body = (
    <div className={styles.alrow}>
      {/* Figma "notiCircle" 44×44 — unread: bg primary-soft + primary icon +
          top-left dot badge. read: bg gray + disabled icon. */}
      <span
        className={`${styles.notiCircle} ${n.read ? styles.notiCircleRead : styles.notiCircleUnread}`}
        aria-hidden
      >
        <Icon name={iconName} size={22} />
        {!n.read && <span className={styles.notiDot} />}
      </span>
      <div className={styles.mid}>
        <h3
          className={`${styles.midTitle} ${n.read ? styles.midTitleRead : ''}`}
        >
          {n.title}
        </h3>
        {n.body && (
          <p
            className={`${styles.midBody} ${n.read ? styles.midBodyRead : ''}`}
          >
            {n.body}
          </p>
        )}
      </div>
      <time className={styles.time}>{time}</time>
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
