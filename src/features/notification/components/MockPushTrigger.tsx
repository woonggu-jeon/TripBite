'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { notificationKeys } from '@/features/notification/hooks/use-notification-inbox';
import { triggerMockPush } from '@/features/notification/utils/subscription';
import { api } from '@/services/api/client';
import styles from './MockPushTrigger.module.scss';

/**
 * mock 모드 전용 — "새 편지 도착" 시뮬레이션 dev 버튼.
 *
 * 흐름:
 *   1) POST /__mock/letter-arrive    — mock 백엔드 inbox 에 항목 prepend
 *   2) triggerMockPush()             — Service Worker 의 MOCK_PUSH 메시지로 OS 알림 표시
 *   3) notification.inbox invalidate — drop-down 즉시 갱신
 *
 * 실 서버 push 인프라(VAPID + web-push) 없이 알림 흐름 (OS 알림 + 인앱 inbox + 클릭 → 편지)
 * 을 end-to-end 로 확인하기 위한 도구. 사용자가 알림 권한을 안 켰으면 OS 알림은 안 뜨지만
 * inbox 항목 추가는 항상 작동.
 *
 * 노출 조건: NEXT_PUBLIC_USE_MSW === 'true' (Providers 에서 조건부 mount).
 */
export function MockPushTrigger() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const fire = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post<{ id: string; link: string }>(
        '/__mock/letter-arrive',
        {
          from: '익명의 여행자',
          preview: '"잘 지내요" — 다섯 글자가 도착했어요',
        },
      );
      await triggerMockPush({
        title: '편지가 도착했어요',
        body: '익명의 여행자가 보낸 다섯 글자',
        link: res.data?.link,
        // 매번 unique tag — 같은 tag 면 OS 가 "update" 로 처리해 새 토스트를
        // 안 띄우는 케이스가 있어 dev 검증 시는 매 호출 다르게.
        tag: `mock-letter-${Date.now()}`,
      });
      await queryClient.invalidateQueries({
        queryKey: notificationKeys.inbox(),
      });
    } catch {
      // mock 환경 dev 도구라 실패해도 silent — 사용자 영향 X
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={fire}
      disabled={busy}
      aria-label="mock 편지 도착 시뮬레이션"
      title="mock 편지 도착 시뮬레이션"
    >
      📬
    </button>
  );
}
