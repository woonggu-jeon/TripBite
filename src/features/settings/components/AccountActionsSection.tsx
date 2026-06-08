'use client';

import { useTranslations } from 'next-intl';
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
    <div className={styles.list}>
      <button
        type="button"
        className={styles.button}
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? t('loggingOut') : t('logout')}
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.danger}`}
        onClick={handleWithdraw}
        disabled={isWithdrawing}
      >
        {isWithdrawing ? t('withdrawing') : t('withdraw')}
      </button>
    </div>
  );
}
