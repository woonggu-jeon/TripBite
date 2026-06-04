'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import { useConfirm } from './use-confirm';

/**
 * 비로그인 사용자가 인증 필요 액션 (저장 / 적용 등) 을 시도할 때 confirm 후
 * 로그인 페이지로 유도한다.
 *
 * 사용:
 *   const requireAuth = useRequireAuth();
 *
 *   <Button onClick={() => requireAuth(() => save.mutate(id), {
 *     reason: '저장은 로그인 후 사용할 수 있어요.',
 *   })}>저장</Button>
 *
 * - 로그인 상태이면 `action` 즉시 호출
 * - 미로그인이면 confirm 모달 → 확인 시 `/login?redirect=현재경로` 로 push
 *   취소 시 noop
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const confirm = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth.requireAuth');

  return async function requireAuth(
    action: () => void | Promise<void>,
    opts: { reason?: string } = {},
  ): Promise<void> {
    if (isAuthenticated) {
      await action();
      return;
    }
    const ok = await confirm({
      title: t('title'),
      description: opts.reason ?? t('description'),
      confirmLabel: t('confirmLabel'),
    });
    if (!ok) return;
    router.push(`/login?redirect=${encodeURIComponent(pathname ?? '/')}`);
  };
}
