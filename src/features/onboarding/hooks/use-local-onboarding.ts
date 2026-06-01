'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * 비인증 사용자용 onboarding 완료 상태 — localStorage.
 *
 * 정책:
 *   - 디바이스 단위 영구 저장 (다른 디바이스에서는 다시 노출)
 *   - 인증 사용자는 백엔드 isOnboarded 가 우선 — 이 hook 은 비인증 fallback
 *   - SSR 안전 (typeof window 가드)
 *
 * 사용:
 *   const { completed, markCompleted } = useLocalOnboarding();
 *
 *   if (!completed) router.replace('/onboarding');
 *   // OnboardingFlow 마지막에 markCompleted();
 */
const STORAGE_KEY = 'tripbite.onboarded';

function readStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // localStorage 접근 차단 (Safari private mode 등) — 기본 false 로 onboarding 항상 노출
    return false;
  }
}

function writeStorage(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, 'true');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 차단 시 noop — UX 손상 없음 (다음 방문 시 다시 노출)
  }
}

/**
 * Hook 형태. mount 후에만 정확한 값 (SSR hydration 안전 — 초기 false).
 */
export function useLocalOnboarding() {
  const [completed, setCompleted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // 첫 mount 에서 한 번 localStorage 읽음 (SSR hydration mismatch 회피)
  useEffect(() => {
    setCompleted(readStorage());
    setHydrated(true);
  }, []);

  const markCompleted = useCallback(() => {
    writeStorage(true);
    setCompleted(true);
  }, []);

  const clear = useCallback(() => {
    writeStorage(false);
    setCompleted(false);
  }, []);

  return { completed, markCompleted, clear, hydrated };
}

/**
 * Hook 외부 (zustand store / middleware 같은 비-React 컨텍스트) 에서 sync 사용.
 */
export const localOnboarding = {
  read: readStorage,
  write: writeStorage,
};
