'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Icon } from '@/components/icon';
import { usePermissionState } from '@/features/location';
import { useMypage } from '@/features/mypage/hooks/use-mypage';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { NicknameEditDialog } from './NicknameEditDialog';
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
  // 시안은 닉네임 변경 행 우측에 현재 닉네임을 보여준다.
  // 소스는 NicknameEditDialog 와 같은 useMypage — auth store 의 persist 값은
  // 낡을 수 있어 다이얼로그 초기값과 어긋난다.
  const { data: mypage } = useMypage();
  const [openDialog, setOpenDialog] = useState<'nickname' | 'password' | null>(
    null,
  );

  const locationValue =
    permission === 'granted'
      ? t('locationGranted')
      : permission === 'denied'
        ? t('locationDenied')
        : permission === 'prompt'
          ? t('locationPrompt')
          : t('locationUnsupported');

  return (
    <div className={styles.list}>
      {/* Figma `row` 360x54 — 라벨 좌측, 우측에 값(있으면) + 20px chevron */}
      <Row
        label={t('changeNickname')}
        value={mypage?.profile.nickname}
        onClick={() => setOpenDialog('nickname')}
      />
      <Row
        label={t('changePassword')}
        onClick={() => setOpenDialog('password')}
      />
      <Row label={t('locationPermission')} value={locationValue} />
      <Row label={t('blockedUsers')} />

      {openDialog === 'nickname' && (
        <NicknameEditDialog onClose={() => setOpenDialog(null)} />
      )}
      {openDialog === 'password' && (
        <ChangePasswordDialog onClose={() => setOpenDialog(null)} />
      )}
    </div>
  );
}

/**
 * 설정 행 하나 — Figma `row` (360x54, padding 16/20).
 * 값 텍스트는 Basic Body/R_14_140%, chevron 은 20px.
 */
function Row({
  label,
  value,
  onClick,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      <span>{label}</span>
      <span className={styles.rowTrailing}>
        {value && <span className={styles.rowValue}>{value}</span>}
        {/* Figma `detailIcon 20px right` — lucide ChevronRight 는 모양이 다르다 */}
        <Icon name="right-20" size={20} className={styles.rowChevron} />
      </span>
    </button>
  );
}
