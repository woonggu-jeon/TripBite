'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ListRow } from '@/components/ui';
import { usePermissionState } from '@/features/location';
import { NicknameEditDialog } from './NicknameEditDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import styles from './SettingsRows.module.scss';

/**
 * 계정/권한 섹션
 *
 * 항목:
 *   - 닉네임 변경 → NicknameEditDialog 모달
 *   - 비밀번호 변경 → ChangePasswordDialog 모달
 *   - 위치 권한 상태 표시 (브라우저에서만 변경 가능)
 *   - 차단한 사용자 관리 → 별도 경로
 *
 * 두 dialog 는 동시에 열리지 않음 — `openDialog` 단일 state 로 union 관리.
 */
export function AccountSettingsSection() {
  const t = useTranslations('settings.account');
  const permission = usePermissionState();
  const [openDialog, setOpenDialog] = useState<'nickname' | 'password' | null>(
    null,
  );

  return (
    <div className={styles.list}>
      <ListRow onClick={() => setOpenDialog('nickname')}>
        {t('changeNickname')}
      </ListRow>

      <ListRow onClick={() => setOpenDialog('password')}>
        {t('changePassword')}
      </ListRow>

      <ListRow
        value={
          (permission === 'granted' && t('locationGranted')) ||
          (permission === 'denied' && t('locationDenied')) ||
          (permission === 'prompt' && t('locationPrompt')) ||
          (permission === 'unsupported' && t('locationUnsupported')) ||
          null
        }
      >
        {t('locationPermission')}
      </ListRow>
      <ListRow>{t('blockedUsers')}</ListRow>

      {openDialog === 'nickname' && (
        <NicknameEditDialog onClose={() => setOpenDialog(null)} />
      )}
      {openDialog === 'password' && (
        <ChangePasswordDialog onClose={() => setOpenDialog(null)} />
      )}
    </div>
  );
}
