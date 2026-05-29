'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Heart, Bookmark, Trash2 } from 'lucide-react';
import { useConfirm } from '@/hooks/use-confirm';
import { haptic } from '@/lib/haptic';
import {
  useDeleteLetter,
  useToggleLikeLetter,
  useToggleSaveLetter,
} from '@/features/letter/hooks/use-letters';
import type { Letter } from '@/features/letter/types';
import styles from './LetterActions.module.scss';

/**
 * 편지 상세 액션 — 좋아요 / 저장 / 삭제.
 *   - 좋아요/저장: toggle (hook 의 onSuccess 가 cache 갱신)
 *   - 삭제: useConfirm() Promise 확인 → DELETE → router.back()
 */
export function LetterActions({ letter }: { letter: Letter }) {
  const t = useTranslations('letter.detail');
  const router = useRouter();
  const confirm = useConfirm();
  const toggleLike = useToggleLikeLetter();
  const toggleSave = useToggleSaveLetter();
  const del = useDeleteLetter();

  const onLike = () => {
    if (toggleLike.isPending) return;
    haptic.tap();
    toggleLike.mutate(letter.id);
  };

  const onSave = () => {
    if (toggleSave.isPending) return;
    haptic.tap();
    toggleSave.mutate(letter.id);
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
    del.mutate(letter.id, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <div className={styles.actions} role="group" aria-label={t('actionsAria')}>
      <button
        type="button"
        className={`${styles.action} ${letter.liked ? styles.liked : ''}`}
        onClick={onLike}
        aria-pressed={letter.liked}
        disabled={toggleLike.isPending}
      >
        <Heart
          size={20}
          fill={letter.liked ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span>{t('like')}</span>
      </button>

      <button
        type="button"
        className={`${styles.action} ${letter.saved ? styles.saved : ''}`}
        onClick={onSave}
        aria-pressed={letter.saved}
        disabled={toggleSave.isPending}
      >
        <Bookmark
          size={20}
          fill={letter.saved ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span>{t('save')}</span>
      </button>

      <button
        type="button"
        className={`${styles.action} ${styles.danger}`}
        onClick={onDelete}
        disabled={del.isPending}
      >
        <Trash2 size={20} aria-hidden />
        <span>{t('delete')}</span>
      </button>
    </div>
  );
}
