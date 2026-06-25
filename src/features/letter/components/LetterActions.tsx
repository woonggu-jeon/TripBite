'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/hooks/use-confirm';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui';
import {
  useDeleteLetter,
  useToggleSaveLetter,
} from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import styles from './LetterActions.module.scss';

/**
 * 편지 상세 액션 — Figma "받은 편지 상세 buttons" (2026-06-25 재정합).
 *
 * 구조 (Frame 26 column gap 10):
 *   - Frame 25 (row gap 8): 삭제 (outline gray 156×52 M_16 muted) + 저장
 *     (primary fill 156×52 M_16 white).
 *   - button 320×52 outline primary M_16 — "홈으로 가기" (사용자 명시).
 *
 * 좋아요 / 답장 button 폐기. 삭제 button 복원 (confirm 모달 → DELETE /me).
 * 저장 button 디바운스 400ms.
 */
const TOGGLE_DEBOUNCE_MS = 400;

export function LetterActions({ letter }: { letter: LetterDto }) {
  const t = useTranslations('letter.detail');
  const router = useRouter();
  const confirm = useConfirm();
  const toggleSave = useToggleSaveLetter();
  const del = useDeleteLetter();

  const [savedLocal, setSavedLocal] = useState(letter.saved);
  useEffect(() => setSavedLocal(letter.saved), [letter.saved]);

  const commitSave = useDebouncedCallback((targetSaved: boolean) => {
    if (targetSaved === letter.saved) return;
    toggleSave.mutate(letter.id);
  }, TOGGLE_DEBOUNCE_MS);

  const onSave = () => {
    haptic.tap();
    setSavedLocal((v) => {
      const next = !v;
      commitSave(next);
      return next;
    });
  };

  const onDelete = async () => {
    if (del.isPending) return;
    haptic.tap();
    const ok = await confirm({
      title: t('deleteConfirmTitle'),
      description: t('deleteConfirmBody'),
      confirmLabel: t('deleteConfirmYes'),
      cancelLabel: t('deleteConfirmNo'),
      destructive: true,
    });
    if (!ok) return;
    haptic.warning();
    commitSave.flush();
    del.mutate(letter.id, {
      onSuccess: () => {
        toast.success(t('deletedToast'));
        router.back();
      },
      onError: () => toast.error(t('deleteFailedToast')),
    });
  };

  const onHome = () => {
    haptic.tap();
    router.replace('/');
  };

  return (
    <div className={styles.buttons} role="group" aria-label={t('actionsAria')}>
      {/* Figma Frame 25 — 삭제 (outline gray) + 저장 (primary fill). */}
      <div className={styles.row}>
        <button
          type="button"
          className={styles.btnGray}
          onClick={onDelete}
          disabled={del.isPending}
        >
          {t('delete')}
        </button>
        <button
          type="button"
          className={`${styles.btnPrimary} ${savedLocal ? styles.btnSavedActive : ''}`}
          onClick={onSave}
          aria-pressed={savedLocal}
        >
          {savedLocal ? t('saved') : t('save')}
        </button>
      </div>

      {/* Figma button 320×52 outline primary — "홈으로 가기". */}
      <Button variant="outlinePrimary" size="lg" fullWidth onClick={onHome}>
        {t('goHome')}
      </Button>
    </div>
  );
}
