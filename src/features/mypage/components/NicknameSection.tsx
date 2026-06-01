'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';
import { useMypage } from '@/features/mypage/hooks/use-mypage';
import { NicknameEditDialog } from './NicknameEditDialog';
import styles from './NicknameSection.module.scss';

/**
 * 닉네임 표시 + 편집 진입점.
 *
 * - 현재 닉네임 + "변경" Button → NicknameEditDialog 오픈.
 * - 서버가 자동 할당한 default 닉네임이면 isDefault hint (muted).
 */
export function NicknameSection() {
  const t = useTranslations('mypage.nickname');
  const { data } = useMypage();
  const [editing, setEditing] = useState(false);

  const nickname = data?.profile.nickname ?? '';
  const isDefault = data?.profile.isDefault === true;

  return (
    <>
      <div className={styles.row}>
        <div className={styles.text}>
          <p className={styles.label}>{t('label')}</p>
          <p className={`${styles.value} ${isDefault ? styles.muted : ''}`}>
            {nickname || t('loading')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditing(true)}
          leadingIcon={<Pencil size={14} aria-hidden />}
          disabled={!nickname}
        >
          {t('edit')}
        </Button>
      </div>
      {editing && (
        <NicknameEditDialog
          initialValue={nickname}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
