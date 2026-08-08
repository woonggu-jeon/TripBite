'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from '@/lib/toast';
import styles from './SettingsRows.module.scss';

/**
 * 계정 액션
 *
 * 항목:
 *   - 로그아웃 (즉시) — Spring 지원
 *   - 회원 탈퇴 — Spring 미지원(DELETE /me 없음) → 준비중 안내
 */
export function AccountActionsSection() {
  const t = useTranslations('settings.actions');
  const tComingSoon = useTranslations('common.comingSoon');
  const confirm = useConfirm();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

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

  // 회원 탈퇴는 Spring 미지원(DELETE /me 없음) → 준비중 toast.
  const handleWithdraw = () => {
    toast.info(tComingSoon('description'));
  };

  // Figma `bw` (V gap 12, padding 20):
  //   로그아웃  320x52 흰 버튼 + 1px 보더, 16px Medium #393939 → Button secondary
  //   회원탈퇴  버튼이 아니라 중앙 정렬 텍스트, 16px Medium #E1493C
  return (
    <div className={styles.actions}>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? t('loggingOut') : t('logout')}
      </Button>
      <button
        type="button"
        className={styles.withdraw}
        onClick={handleWithdraw}
      >
        {t('withdraw')}
      </button>
    </div>
  );
}
