'use client';

import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';

/**
 * 비밀번호 변경 dialog — 설정 페이지의 모달.
 *
 * 본문은 `ChangePasswordForm` 재사용 (현재 비번 + 새 비번 + 확인 + 검증 + mutation).
 * Dialog primitive 가 backdrop / ESC / focus trap / a11y 담당.
 * 폼 onDone 시 자동 close.
 */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings.account.changePasswordDialog');

  return (
    <Dialog open onClose={onClose} title={t('title')} showCloseButton>
      <ChangePasswordForm onDone={onClose} />
    </Dialog>
  );
}
