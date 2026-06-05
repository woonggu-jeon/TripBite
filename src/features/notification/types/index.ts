/**
 * 인앱 알림함 도메인 — `/notifications` 페이지 + 헤더 종 badge.
 *
 * 알림 종류 (docs/API_CONTRACT.md §Notifications):
 *   1) 받은 편지 도착   — letter.received
 *   2) 내 편지에 좋아요 — letter.liked
 *   3) 토너먼트 공유    — tournament.shared
 *   4) 일반 이벤트/공지 — event
 *   5) 보안 알림        — security (비밀번호 변경 등)
 *
 * 향후 확장 시 type 유니온에 추가하고 NotificationItem.TYPE_ICON 도 함께.
 * UI 에서는 unknown type 도 Bell fallback 으로 안전 처리.
 */
export type NotificationType =
  | 'letter.received'
  | 'letter.liked'
  | 'tournament.shared'
  | 'event'
  | 'security';

export type AppNotification = {
  id: string;
  type: NotificationType;
  /** 표시용 텍스트 (예: "새로운 편지가 도착했어요") */
  title: string;
  /** 부가 정보 (예: 보낸 사람 닉네임, 편지 미리보기 등) */
  body?: string;
  /** 알림 카드용 이미지 (선택) — 발신자 avatar 또는 destination thumbnail 등 */
  imageUrl?: string;
  /** 클릭 시 이동할 경로 (예: /letter/[id]) */
  link?: string;
  read: boolean;
  createdAt: string; // ISO
};

export type NotificationInbox = {
  items: AppNotification[];
  unreadCount: number;
  /** 다음 페이지 cursor. 마지막 페이지면 null (또는 omit). */
  nextCursor?: number | string | null;
};
