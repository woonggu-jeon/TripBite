'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut } from 'lucide-react';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { useMe } from '@/features/auth/hooks/use-auth';
import { authKeys } from '@/features/auth/hooks/use-auth';
import styles from './MockAuthToggle.module.scss';

/**
 * mock 모드 전용 — 로그인/로그아웃 상태를 한 번에 토글하는 dev 버튼.
 *
 * 흐름:
 *   - 현재 인증 상태에 따라 라벨/아이콘 분기
 *   - 클릭 시 mock POST /auth/login 또는 /auth/logout 호출 → mockSignedIn 토글
 *   - auth 캐시 invalidate → AuthBootstrap 이 /me 재조회 → 보호 경로 client 가드 동작
 *
 * 노출 조건: NEXT_PUBLIC_USE_MSW === 'true' (AppHeader 에서 조건부 mount).
 */
export function MockAuthToggle() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isFetching } = useMe();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy || isFetching) return;
    setBusy(true);
    try {
      await api.post(isAuthenticated ? '/auth/logout' : '/auth/login', {});
      // /me 재조회 → AuthBootstrap 의 setAuth / clearAuth + protected redirect
      await queryClient.invalidateQueries({ queryKey: authKeys.me() });
    } finally {
      setBusy(false);
    }
  };

  const label = isAuthenticated ? 'mock 로그아웃' : 'mock 로그인';
  const Icon = isAuthenticated ? LogOut : LogIn;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || isFetching}
      className={styles.button}
      aria-label={label}
      title={label}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}
