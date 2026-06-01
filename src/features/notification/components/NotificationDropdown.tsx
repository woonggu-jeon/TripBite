'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Heart } from 'lucide-react';
import {
  useNotificationInbox,
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
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import styles from './NotificationDropdown.module.scss';

const PUSH_PROMPT_DISMISS_KEY = 'tripbite.push-prompt.dismissed';

/**
 * 헤더 알림 버튼 클릭 시 노출되는 드롭다운
 *
 * i18n: useTranslations('notification') 으로 헤더/빈 상태 라벨 처리.
 * 알림 항목 본문(title, body)은 서버가 이미 사용자 locale에 맞춰 내려주는 것을
 * 가정 (백엔드에서 Accept-Language 또는 NEXT_LOCALE 쿠키 참조).
 * 혹은 서버는 i18n 키만 내려주고 클라이언트에서 t()로 변환하는 방식도 가능 —
 * 이 경우엔 type을 키 enum으로 두고 매핑 객체 사용.
 *
 * 사양:
 *   - 알림 목록 (최신순)
 *   - 안 읽음은 좌측 도트 표시 + 약한 배경
 *   - 항목 클릭 → 읽음 처리 + link로 이동
 *   - 우상단 "모두 읽음" 버튼
 *   - 외부 클릭/ESC로 닫기
 */

const TYPE_ICON: Record<NotificationType, typeof Mail> = {
  'letter.received': Mail,
  'letter.liked': Heart,
};

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const t = useTranslations('notification');
  const tCommon = useTranslations('common');
  const { data, isLoading } = useNotificationInbox();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 / ESC 로 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const items = data?.items ?? [];

  return (
    <div
      className={styles.dropdown}
      ref={ref}
      role="dialog"
      aria-label={t('title')}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t('title')}</span>
        {items.some((n) => !n.read) && (
          <button
            type="button"
            className={styles.allRead}
            onClick={() => markAllRead()}
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      <PushPrompt />

      <div className={styles.list}>
        {isLoading && (
          // 3 row skeleton — 알림 항목 layout 과 동일 dimension 으로 자리잡이
          <div className={styles.skeletonList} aria-label={tCommon('loading')}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeletonItem}>
                <Skeleton width={28} height={28} radius="full" />
                <div className={styles.skeletonLines}>
                  <Skeleton width="80%" height={14} radius="sm" />
                  <Skeleton width="55%" height={12} radius="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={<Mail size={28} aria-hidden />}
            title={t('empty')}
          />
        )}
        {items.map((n) => (
          <Item
            key={n.id}
            n={n}
            onSelect={() => {
              if (!n.read) markRead(n.id);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 알림함 진입 시 한 번만 노출되는 푸시 권한 prompt.
 *
 * 노출 조건:
 *   - Notification.permission === 'default' (아직 요청 안 함)
 *   - 사용자가 X 로 닫지 않음 (localStorage 기록)
 *   - 브라우저가 push 지원
 *
 * iOS 안내 분기:
 *   - iOS 인데 standalone(홈 추가) 아니면 "홈에 추가 후 알림" 안내만 노출 — 권한
 *     요청 자체가 silent fail 이라 enable 버튼 비활성.
 *   - iOS + standalone 이면 일반 흐름.
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
      // ignore
    }
    setShow(false);
  };

  const handleEnable = async () => {
    if (iosNeedsInstall) return; // iOS 일반 탭 — 권한 요청 silent fail
    await enable();
    // status 가 enabled / denied 어느 쪽이든 prompt 는 닫기
    dismiss();
  };

  return (
    <div className={styles.pushPrompt}>
      <p className={styles.pushPromptText}>{t('text')}</p>
      {iosNeedsInstall && (
        <p className={styles.pushPromptHint}>{t('iosInstallHint')}</p>
      )}
      <div className={styles.pushPromptActions}>
        <button
          type="button"
          className={styles.pushEnable}
          onClick={handleEnable}
          disabled={iosNeedsInstall || status === 'requesting'}
        >
          {iosNeedsInstall
            ? t('iosCta')
            : status === 'requesting'
              ? t('requesting')
              : t('enable')}
        </button>
        <button type="button" className={styles.pushDismiss} onClick={dismiss}>
          {t('dismiss')}
        </button>
      </div>
    </div>
  );
}

function Item({ n, onSelect }: { n: AppNotification; onSelect: () => void }) {
  const Icon = TYPE_ICON[n.type];
  const body = (
    <div className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
      <Icon size={18} className={styles.icon} />
      <div>
        <div className={styles.itemTitle}>{n.title}</div>
        {n.body && <div className={styles.itemBody}>{n.body}</div>}
      </div>
    </div>
  );

  if (n.link) {
    return (
      // n.link는 백엔드에서 오는 임의 경로 — typedRoutes 정적 분석 외라 cast
      <Link
        href={n.link as React.ComponentProps<typeof Link>['href']}
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
