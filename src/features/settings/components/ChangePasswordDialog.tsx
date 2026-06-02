'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import styles from './NicknameEditDialog.module.scss';

/**
 * 비밀번호 변경 dialog — 설정 페이지의 모달.
 *
 * 본문은 `ChangePasswordForm` 재사용 (현재 비번 + 새 비번 + 확인 + 검증 + mutation).
 * 외부 클릭 / ESC 로 close. 폼 onDone 시 자동 close.
 *
 * NicknameEditDialog 와 동일 backdrop/dialog SCSS 공유 — 일관된 모달 디자인.
 */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings.account.changePasswordDialog');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-change-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="password-change-title" className={styles.title}>
            {t('title')}
          </h2>
          <IconButton
            aria-label={tCommon('close')}
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={16} aria-hidden />
          </IconButton>
        </div>

        <ChangePasswordForm onDone={onClose} />
      </div>
    </div>
  );
}
