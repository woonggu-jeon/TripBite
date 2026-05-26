'use client';

import { useTranslations } from 'next-intl';
import { useLogout } from '@/features/auth/hooks/use-auth';
import styles from './SettingsRows.module.scss';

/**
 * 계정 액션
 *
 * 항목:
 *   - 로그아웃 (즉시)
 *   - 회원 탈퇴 (확인 모달 → 비밀번호 재입력 권장)
 *   - 문의하기 (mailto: 또는 외부 폼)
 *
 * 탈퇴 정책 (백엔드와 합의):
 *   - soft delete 권장 (30일 유예)
 *   - 보낸 편지는 익명 처리하여 보존? 또는 함께 삭제? — 결정 필요
 */
export function AccountActionsSection() {
  const t = useTranslations('settings.actions');
  const { mutate: logout, isPending } = useLogout();

  return (
    <div className={styles.list}>
      <button
        type="button"
        className={styles.button}
        onClick={() => logout()}
        disabled={isPending}
      >
        {isPending ? t('loggingOut') : t('logout')}
      </button>
      <a
        href="mailto:support@example.com"
        className={styles.button}
      >
        {t('contact')}
      </a>
      <button
        type="button"
        className={`${styles.button} ${styles.danger}`}
        // TODO: 확인 모달 → DELETE /me
      >
        {t('withdraw')}
      </button>
    </div>
  );
}
