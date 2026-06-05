import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { NotificationsClient } from './_components/NotificationsClient';

/**
 * 알림함 (/notifications)
 *
 * 구성 (위 → 아래):
 *   1) SubHeader      — 제목 + 뒤로가기 + "모두 읽음" rightSlot (unread > 0 일 때만)
 *   2) PushPrompt     — 브라우저 push 권한 요청 (default 권한 + 미dismiss 일 때만)
 *   3) NotificationList
 *      - 무한스크롤 (편지/시군콘텐츠와 동일 cursor 컨벤션)
 *      - 빈 상태: EmptyState
 *      - 로딩: Skeleton 3 row
 *
 * 인증:
 *   - 보호 경로 — 비인증 시 axios interceptor 가 /login?redirect=/notifications 로 redirect
 *   - mock 모드도 mockSignedIn 토글에 따라 동일 분기.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notification');
  return { title: t('title') };
}

export default function NotificationsPage() {
  return <NotificationsClient />;
}
