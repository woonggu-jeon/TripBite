'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Mail, Heart } from 'lucide-react';
import {
  useNotificationInbox,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/features/notification/hooks/use-notification-inbox';
import type {
  AppNotification,
  NotificationType,
} from '@/features/notification/types';
import styles from './NotificationDropdown.module.scss';

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
    <div className={styles.dropdown} ref={ref} role="dialog" aria-label={t('title')}>
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

      <div className={styles.list}>
        {isLoading && <div className={styles.empty}>{tCommon('loading')}</div>}
        {!isLoading && items.length === 0 && (
          <div className={styles.empty}>{t('empty')}</div>
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

function Item({
  n,
  onSelect,
}: {
  n: AppNotification;
  onSelect: () => void;
}) {
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
      <Link href={n.link} onClick={onSelect} className={styles.link}>
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
