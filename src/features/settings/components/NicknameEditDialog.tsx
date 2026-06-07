'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button, IconButton, TextField } from '@/components/ui';
import {
  useMypage,
  useUpdateNickname,
} from '@/features/mypage/hooks/use-mypage';
import { nicknameSchema } from '@/features/onboarding/schemas/nickname';
import { toast } from '@/lib/toast';
import styles from './NicknameEditDialog.module.scss';

/**
 * 닉네임 편집 dialog — 설정 페이지의 모달.
 *
 * 검증: `nicknameSchema` (zod) 재사용 — onboarding 과 동일 규칙.
 * 외부 클릭 / ESC 로 close. submit 후 onClose 호출.
 *
 * 초기 닉네임은 `useMypage` 에서 자체 fetch — 호출처(설정 페이지) 가 별도로
 * profile 을 들고 있을 필요 없음.
 */
export function NicknameEditDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings.account.nicknameDialog');
  const tCommon = useTranslations('common');
  const { data } = useMypage();
  const initialValue = data?.profile.nickname ?? '';
  const update = useUpdateNickname();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // useMypage 가 mount 후 들어오면 input 도 동기
  useEffect(() => {
    if (initialValue && !value) setValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = () => {
    const parsed = nicknameSchema.safeParse({ nickname: value });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? t('invalid');
      setError(first);
      return;
    }
    setError(null);
    update.mutate(
      { nickname: value },
      {
        onSuccess: () => {
          toast.success(t('saved'));
          onClose();
        },
        onError: () => {
          toast.error(t('saveFailed'));
        },
      },
    );
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nickname-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="nickname-edit-title" className={styles.title}>
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

        <TextField
          ref={inputRef}
          id="nickname-edit"
          type="text"
          label={t('label')}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          maxLength={20}
          errorMessage={error}
        />

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={update.isPending}
            disabled={!value.trim() || value === initialValue}
          >
            {tCommon('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
