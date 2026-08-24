'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Icon, type IconName } from '@/components/icon';
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
import type {
  AppNotificationDto,
  AppNotificationType,
} from '@/types/api-domain';
import styles from './NotificationsClient.module.scss';

const PUSH_PROMPT_DISMISS_KEY = 'tripbite.push-prompt.dismissed';

/**
 * type 별 아이콘 매핑 — Figma 스프라이트 아이콘(구 lucide 대체).
 * Figma `notiCircle` 안 아이콘은 편지=메일, 이벤트/공유=트로피.
 * unknown type 은 `?? 'noti'`(벨) 로 fallback.
 */
const TYPE_ICON: Record<AppNotificationType, IconName> = {
  'letter.received': 'mail',
  'letter.liked': 'heart-20',
  // 보낸 편지가 누군가에게 도착 완료 — 발신자에게 알림.
  'letter.delivered': 'mail',
  'tournament.shared': 'trophy',
  // 충북 마스터 달성 / 우승지 저장 한도 등은 BE 가 event type + 차별화된 link 로 발행.
  event: 'trophy',
  security: 'noti',
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
            icon={<Icon name="noti" size={36} />}
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
                <Skeleton width={44} height={44} radius="full" />
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
              // Figma `알림 빈 상태` — circleIcon(size=36, name=noti)
              <EmptyState
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

/**
 * 알림 행 하나 — Figma `notiIcon` (360x76, H gap 12, padding 16/20).
 *
 *   원형 44 (읽지 않음: #EAF6EF 면 + 초록 아이콘 + 우하단 9px 초록 점 /
 *            읽음: 회색 면 + 회색 아이콘)
 *   + 제목 Basic Body/B_14_140% + 본문 Caption/R_12  (V gap 4)
 *   + 우측 시각 Caption/R_12
 *
 * 시안은 읽은 알림 전체를 #B4B4B4 로 흐리게 하지만 2.07:1 로 AA 미달이라
 * --color-muted 로 대체한다 (결정 2).
 */
function Item({
  n,
  onSelect,
}: {
  n: AppNotificationDto;
  onSelect: () => void;
}) {
  const iconName = TYPE_ICON[n.type] ?? 'noti';
  const time = useRelativeTimeLabel(n.createdAt);
  const body = (
    <div className={`${styles.item} ${n.read ? styles.read : ''}`}>
      <span className={styles.iconCircle} aria-hidden>
        <Icon name={iconName} size={22} />
        {!n.read && <span className={styles.dot} />}
      </span>
      <span className={styles.itemText}>
        <span className={styles.itemTitle}>{n.title}</span>
        {n.body && <span className={styles.itemBody}>{n.body}</span>}
      </span>
      <span className={styles.itemTime}>{time}</span>
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

/** letter.relativeTime 키 재사용 — 알림 전용 문구를 새로 만들지 않는다. */
function useRelativeTimeLabel(iso: string): string {
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
    case 'date': {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
  }
}
