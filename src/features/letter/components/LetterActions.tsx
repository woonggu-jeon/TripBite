'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Heart, Bookmark, Trash2 } from 'lucide-react';
import { useConfirm } from '@/hooks/use-confirm';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import {
  useDeleteLetter,
  useToggleLikeLetter,
  useToggleSaveLetter,
} from '@/features/letter/hooks/use-letters';
import type { Letter } from '@/features/letter/types';
import styles from './LetterActions.module.scss';

/**
 * 편지 상세 액션 — 좋아요 / 저장 / 삭제.
 *
 * 좋아요·저장: 빠른 연속 클릭을 흡수하기 위해 컴포넌트 로컬 상태 + 디바운스(400ms).
 *   - 클릭 즉시 로컬 state 토글(즉각 UI 피드백, haptic.tap)
 *   - 디바운스 만료 시 서버 진실(letter.liked/saved)과 비교 → net change 시에만 mutate
 *   - 짝수 번 클릭으로 원위치 시 API 호출 자체 skip → 서버 부담 / race ↓
 *   - mutate 의 onMutate optimistic update 가 다른 화면(LetterRow 등) 까지 즉시 동기화
 *
 * 삭제: useConfirm() Promise 확인 → DELETE → router.back().
 *   디바운스 불필요 — 명시적 확인 단계가 이미 게이트 역할.
 */
const TOGGLE_DEBOUNCE_MS = 400;

export function LetterActions({ letter }: { letter: Letter }) {
  const t = useTranslations('letter.detail');
  const router = useRouter();
  const confirm = useConfirm();
  const toggleLike = useToggleLikeLetter();
  const toggleSave = useToggleSaveLetter();
  const del = useDeleteLetter();

  const [likedLocal, setLikedLocal] = useState(letter.liked);
  const [savedLocal, setSavedLocal] = useState(letter.saved);

  // 외부에서 letter 가 갱신되면 (예: cache invalidate 후 refetch) 로컬도 동기.
  useEffect(() => setLikedLocal(letter.liked), [letter.liked]);
  useEffect(() => setSavedLocal(letter.saved), [letter.saved]);

  const commitLike = useDebouncedCallback((targetLiked: boolean) => {
    if (targetLiked === letter.liked) return; // net change 없음 — skip
    toggleLike.mutate(letter.id);
  }, TOGGLE_DEBOUNCE_MS);

  const commitSave = useDebouncedCallback((targetSaved: boolean) => {
    if (targetSaved === letter.saved) return;
    toggleSave.mutate(letter.id);
  }, TOGGLE_DEBOUNCE_MS);

  const onLike = () => {
    haptic.tap();
    setLikedLocal((v) => {
      const next = !v;
      commitLike(next);
      return next;
    });
  };

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
    // 삭제 직전 대기 중인 토글이 있으면 즉시 flush — 서버 상태 일관성 보장
    commitLike.flush();
    commitSave.flush();
    del.mutate(letter.id, {
      onSuccess: () => {
        toast.success(t('deletedToast'));
        router.back();
      },
      onError: () => toast.error(t('deleteFailedToast')),
    });
  };

  return (
    <div className={styles.actions} role="group" aria-label={t('actionsAria')}>
      <button
        type="button"
        className={`${styles.action} ${likedLocal ? styles.liked : ''}`}
        onClick={onLike}
        aria-pressed={likedLocal}
      >
        <Heart
          size={20}
          fill={likedLocal ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span>{t('like')}</span>
      </button>

      <button
        type="button"
        className={`${styles.action} ${savedLocal ? styles.saved : ''}`}
        onClick={onSave}
        aria-pressed={savedLocal}
      >
        <Bookmark
          size={20}
          fill={savedLocal ? 'currentColor' : 'none'}
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
