'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ListRow } from '@/components/ui';
import { usePermissionState } from '@/features/location';
import { useMypage } from '@/features/mypage/hooks/use-mypage';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { NicknameEditDialog } from './NicknameEditDialog';
import styles from './SettingsRows.module.scss';

/**
 * 계정/권한 섹션 — Figma "설정" page (2026-06-23) 정합.
 *
 * 노출 3 row (사용자 명시):
 *   - 닉네임 변경 → NicknameEditDialog 모달
 *   - 비밀번호 변경 → ChangePasswordDialog 모달
 *   - 위치 권한 상태 표시 (브라우저에서만 변경 가능, value 패턴)
 *
 * 차단한 사용자 관리 — Figma 외 + 사용자 미사용 명시. UI 제거.
 *
 * 두 dialog 는 동시에 열리지 않음 — `openDialog` 단일 state 로 union 관리.
 */
export function AccountSettingsSection() {
  const t = useTranslations('settings.account');
  const permission = usePermissionState();
  const { data: mypage } = useMypage();
  const [openDialog, setOpenDialog] = useState<'nickname' | 'password' | null>(
    null,
  );
  // Figma "설정 row" 우측 value 슬롯 — 현재 닉네임 표시 (사용자 명시 2026-06-24).
  const currentNickname = mypage?.profile.nickname ?? null;

  return (
    <div className={styles.list}>
      <ListRow
        onClick={() => setOpenDialog('nickname')}
        value={currentNickname}
      >
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

      {openDialog === 'nickname' && (
        <NicknameEditDialog onClose={() => setOpenDialog(null)} />
      )}
      {openDialog === 'password' && (
        <ChangePasswordDialog onClose={() => setOpenDialog(null)} />
      )}
    </div>
  );
}
