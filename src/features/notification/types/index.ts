/**
 * 인앱 알림함 도메인
 *
 * 헤더의 알림 버튼 클릭 시 노출되는 NotificationDropdown 에서 사용.
 *
 * 알림 종류:
 *   1) 받은 편지 도착   — letter.received
 *   2) 내 편지에 좋아요 — letter.liked
 *   3) 토너먼트 공유    — tournament.shared
 *   4) 일반 이벤트/공지 — event
 *
 * 향후 확장 시 type 유니온에 추가하고 NotificationDropdown.TYPE_ICON 도 함께.
 * UI 에서는 unknown type 도 Bell fallback 으로 안전 처리.
 */
export type NotificationType =
  | 'letter.received'
  | 'letter.liked'
  | 'tournament.shared'
  | 'event';

export type AppNotification = {
  id: string;
  type: NotificationType;
  /** 표시용 텍스트 (예: "새로운 편지가 도착했어요") */
  title: string;
  /** 부가 정보 (예: 보낸 사람 닉네임, 편지 미리보기 등) */
  body?: string;
  /** 클릭 시 이동할 경로 (예: /letter/[id]) */
  link?: string;
  read: boolean;
  createdAt: string; // ISO
};

export type NotificationInbox = {
  items: AppNotification[];
  unreadCount: number;
};
