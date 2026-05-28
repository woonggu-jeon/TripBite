'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePermissionState } from '@/features/location';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import styles from './SettingsRows.module.scss';

/**
 * 계정/권한 섹션
 *
 * 항목:
 *   - 닉네임 변경 (모달 또는 인라인 — NicknameEditDialog 재사용)
 *   - 위치 권한 상태 표시 + "기기 설정에서 변경" 안내
 *     · 권한은 브라우저에서만 변경 가능 (앱에서 다시 prompt 불가능)
 *   - 차단한 사용자 관리 → 별도 경로 또는 모달
 *     · 편지 수신 거부 목록 표시 + 해제
 */
export function AccountSettingsSection() {
  const t = useTranslations('settings.account');
  const permission = usePermissionState();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className={styles.list}>
      <button type="button" className={styles.button}>
        {t('changeNickname')}
      </button>

      <button
        type="button"
        className={styles.button}
        onClick={() => setShowChangePassword((v) => !v)}
        aria-expanded={showChangePassword}
      >
        {t('changePassword')}
      </button>
      {showChangePassword && (
        <div style={{ padding: '0.5rem 0.25rem' }}>
          <ChangePasswordForm onDone={() => setShowChangePassword(false)} />
        </div>
      )}

      <button type="button" className={styles.button}>
        <div>{t('locationPermission')}</div>
        <div className={styles.rowHint}>
          {permission === 'granted' && t('locationGranted')}
          {permission === 'denied' && t('locationDenied')}
          {permission === 'prompt' && t('locationPrompt')}
          {permission === 'unsupported' && t('locationUnsupported')}
        </div>
      </button>
      <button type="button" className={styles.button}>
        {t('blockedUsers')}
      </button>
    </div>
  );
}
