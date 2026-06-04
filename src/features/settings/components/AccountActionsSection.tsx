'use client';

import { useTranslations } from 'next-intl';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from '@/lib/toast';
import styles from './SettingsRows.module.scss';

/**
 * 계정 액션
 *
 * 항목:
 *   - 로그아웃 (즉시)
 *   - 회원 탈퇴 (confirm 모달 → DELETE /me)
 *   - 문의하기 (mailto:)
 *
 * 탈퇴 정책 (백엔드와 합의):
 *   - soft delete 권장 (30일 유예)
 *   - 보낸 편지는 익명 처리하여 보존? 또는 함께 삭제? — 결정 필요
 *
 * 현재는 confirm 까지만 wired — DELETE /me mutation 은 BE 준비 후 추가.
 */
export function AccountActionsSection() {
  const t = useTranslations('settings.actions');
  const confirm = useConfirm();
  const { mutate: logout, isPending } = useLogout();

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
    // TODO(backend): mypageApi.deleteAccount() / DELETE /me. soft delete + 로그아웃 flow.
    toast.info(t('withdrawPending'));
  };

  return (
    <div className={styles.list}>
      <button
        type="button"
        className={styles.button}
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? t('loggingOut') : t('logout')}
      </button>
      <a href="mailto:support@example.com" className={styles.button}>
        {t('contact')}
      </a>
      <button
        type="button"
        className={`${styles.button} ${styles.danger}`}
        onClick={handleWithdraw}
      >
        {t('withdraw')}
      </button>
    </div>
  );
}
