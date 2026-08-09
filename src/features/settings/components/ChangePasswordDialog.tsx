'use client';

import { useTranslations } from 'next-intl';
import { ComingSoon } from '@/components/feedback/ComingSoon';
import { Dialog } from '@/components/ui';

/**
 * 비밀번호 변경 dialog — 설정 페이지의 모달.
 *
 * BE-TODO(§5 P1-3): 비밀번호 변경 — Spring 미지원(POST /me/change-password 없음,
 * PATCH /me{password} 는 currentPassword 검증 불가) → 준비중 안내.
 * 엔드포인트 추가 시 ComingSoon → ChangePasswordForm + useChangePassword 복원.
 */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings.account.changePasswordDialog');

  return (
    <Dialog open onClose={onClose} title={t('title')} showCloseButton>
      <ComingSoon title={t('title')} />
    </Dialog>
  );
}
