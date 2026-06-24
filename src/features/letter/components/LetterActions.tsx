'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { haptic } from '@/lib/haptic';
import { Button } from '@/components/ui';
import {
  useToggleLikeLetter,
  useToggleSaveLetter,
} from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/api/generated/schemas';
import styles from './LetterActions.module.scss';

/**
 * 편지 상세 액션 — Figma "받은 편지 상세 · buttons" (2026-06-24) 정합.
 *
 * 구조 (Frame 26 column gap 10):
 *   - Frame 25 (row gap 8): 저장 (outline gray 156×52 M_16 muted) + 좋아요
 *     (primary fill 156×52 M_16 white).
 *   - button 320×52 outline primary M_16 — "답장 쓰기" (Figma 명시).
 *
 * 좋아요·저장 디바운스(400ms) — 빠른 연속 클릭 흡수, net change 시에만 mutate.
 * 삭제 액션은 Figma spec 외 — 추후 SubHeader rightSlot 또는 kebab 메뉴 도입 시
 * 재추가 (현재 미노출).
 */
const TOGGLE_DEBOUNCE_MS = 400;

export function LetterActions({ letter }: { letter: LetterDto }) {
  const t = useTranslations('letter.detail');
  const router = useRouter();
  const toggleLike = useToggleLikeLetter();
  const toggleSave = useToggleSaveLetter();

  const [likedLocal, setLikedLocal] = useState(letter.liked);
  const [savedLocal, setSavedLocal] = useState(letter.saved);

  useEffect(() => setLikedLocal(letter.liked), [letter.liked]);
  useEffect(() => setSavedLocal(letter.saved), [letter.saved]);

  const commitLike = useDebouncedCallback((targetLiked: boolean) => {
    if (targetLiked === letter.liked) return;
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

  const onReply = () => {
    haptic.tap();
    router.push('/letter/compose');
  };

  return (
    <div className={styles.buttons} role="group" aria-label={t('actionsAria')}>
      {/* Figma Frame 25 — 저장 (outline gray) + 좋아요 (primary fill). */}
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.btnGray} ${savedLocal ? styles.btnSavedActive : ''}`}
          onClick={onSave}
          aria-pressed={savedLocal}
        >
          {savedLocal ? t('saved') : t('save')}
        </button>
        <button
          type="button"
          className={`${styles.btnPrimary} ${likedLocal ? styles.btnLikedActive : ''}`}
          onClick={onLike}
          aria-pressed={likedLocal}
        >
          {likedLocal ? t('liked') : t('like')}
        </button>
      </div>

      {/* Figma button 320×52 outline primary — "답장 쓰기". */}
      <Button variant="outline" fullWidth onClick={onReply}>
        {t('reply')}
      </Button>
    </div>
  );
}
