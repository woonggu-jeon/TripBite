'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { authKeys, useMe } from '@/features/auth/hooks/use-auth';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/stores/auth-store';
import styles from './MockAuthToggle.module.scss';

/**
 * mock 모드 전용 — 로그인/로그아웃 상태를 한 번에 토글하는 dev 버튼.
 *
 * 로그아웃 흐름:
 *   1) POST /auth/logout → mockSignedIn=false
 *   2) clearAuth() + queryClient.removeQueries(['auth','me'])
 *   3) /me 재호출 X (removeQueries 로 캐시 비워짐) → 401 → hard redirect 무한 회귀 방지
 *
 * 로그인 흐름:
 *   1) POST /auth/login → mockSignedIn=true
 *   2) invalidate authKeys.me() → 본 컴포넌트의 useMe refetch → setAuth
 *
 * 노출 조건: NEXT_PUBLIC_USE_MSW === 'true' (AppHeader 에서 조건부 mount).
 */
export function MockAuthToggle() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { isFetching } = useMe();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy || isFetching) return;
    setBusy(true);
    try {
      if (isAuthenticated) {
        await api.post('/auth/logout', {});
        clearAuth();
        // /me 캐시 제거 — invalidate 면 refetch 가 401 → refresh 흐름 타서 hard redirect.
        queryClient.removeQueries({ queryKey: authKeys.me() });
      } else {
        await api.post('/auth/login', {});
        // refetchType: 'all' — error 상태였던 query 도 강제 refetch (default 'active' 는
        // 에러 query 가 stale 로 mark 만 되고 refetch 안 될 수 있음).
        await queryClient.invalidateQueries({
          queryKey: authKeys.me(),
          refetchType: 'all',
        });
      }
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
