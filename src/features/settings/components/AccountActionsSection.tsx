'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { useDeleteAccount, useLogout } from '@/features/auth/hooks/use-auth';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from '@/lib/toast';
import styles from './SettingsRows.module.scss';

/**
 * 계정 액션
 *
 * 항목:
 *   - 로그아웃 (즉시)
 *   - 회원 탈퇴 (confirm 모달 → DELETE /me)
 *
 * 탈퇴 정책 (BE 합의 — Swagger §Auth, DELETE /me):
 *   - DELETE /me → 204 (소프트 삭제 + 세션 무효)
 *   - FE: clearAuth + cache clear + SW cache clear + 홈으로 redirect (refresh)
 */
export function AccountActionsSection() {
  const t = useTranslations('settings.actions');
  const confirm = useConfirm();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: deleteAccount, isPending: isWithdrawing } =
    useDeleteAccount();

  const handleLogout = async () => {
    const ok = await confirm({
      title: t('logoutConfirmTitle'),
      description: t('logoutConfirmDescription'),
      confirmLabel: t('logoutConfirmLabel'),
      // 로그아웃은 reversible — destructive 톤은 회원 탈퇴에만 사용
    });
    if (!ok) return;
    logout();
  };

  const handleWithdraw = async () => {
    const ok = await confirm({
      title: t('withdrawConfirmTitle'),
      description: t('withdrawConfirmDescription'),
      confirmLabel: t('withdrawConfirmLabel'),
      destructive: true,
    });
    if (!ok) return;
    deleteAccount(undefined, {
      onError: () => toast.error(t('withdrawFailed')),
      // onSuccess 시점엔 이미 useDeleteAccount 의 onSettled 가 cleanup + redirect.
      // toast 는 사용자가 새 페이지에서 본 후 인지 — 굳이 success toast X.
    });
  };

  return (
    // Figma "설정" page bw frame (2026-06-23) — column 320x52 button + danger.
    // Button.s-lg variant=secondary 가 center align + radius 12 + Body M_16
    // 정합. border-color (--color-stroke #C6C6C6) + color override 는
    // .actionButton / .actionButtonDanger 가 처리.
    <div className={styles.actionStack}>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? t('loggingOut') : t('logout')}
      </Button>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        // color override: className 으로는 Button.v-outline 의 muted color
        // 와 동일 specificity → CSS module inject 순서 의존 (회귀 위험).
        // inline style 로 cascade 강제 (--color-danger 토큰은 light/dark
        // 모두 정의 — dark mode 영향 없음). 2026-06-23 회귀 fix.
        style={{ color: 'var(--color-danger)' }}
        onClick={handleWithdraw}
        disabled={isWithdrawing}
      >
        {isWithdrawing ? t('withdrawing') : t('withdraw')}
      </Button>
    </div>
  );
}
