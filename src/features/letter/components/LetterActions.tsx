'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/hooks/use-confirm';
import { Button } from '@/components/ui';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import {
  useDeleteLetter,
  useToggleSaveLetter,
} from '@/features/letter/hooks/use-letters';
import type { LetterDto } from '@/types/api-domain';
import styles from './LetterActions.module.scss';

/**
 * 편지 상세 액션 — Figma `받은 편지 상세 > buttons`.
 *
 *   [삭제 156 라인] [저장 156 채움]      ← gap 8
 *   [    편지함으로 320 초록 라인    ]    ← gap 10 (시안 "홈으로 가기")
 *
 * 시안에는 좋아요 버튼이 없다 (목록 행 액션도 하트가 아니라 북마크) — 구 구현의
 * 3버튼(좋아요/저장/삭제) 중 좋아요를 뺐다. useToggleLikeLetter 는 남아 있다.
 *
 * 저장: 빠른 연속 클릭을 흡수하기 위해 컴포넌트 로컬 상태 + 디바운스(400ms).
 *   - 클릭 즉시 로컬 state 토글(즉각 UI 피드백, haptic.tap)
 *   - 디바운스 만료 시 서버 진실(letter.liked/saved)과 비교 → net change 시에만 mutate
 *   - 짝수 번 클릭으로 원위치 시 API 호출 자체 skip → 서버 부담 / race ↓
 *   - mutate 의 onMutate optimistic update 가 다른 화면(LetterRow 등) 까지 즉시 동기화
 *
 * 삭제: useConfirm() Promise 확인 → DELETE → router.back().
 *   디바운스 불필요 — 명시적 확인 단계가 이미 게이트 역할.
 */
const TOGGLE_DEBOUNCE_MS = 400;

export function LetterActions({ letter }: { letter: LetterDto }) {
  const t = useTranslations('letter.detail');
  const router = useRouter();
  const confirm = useConfirm();
  const toggleSave = useToggleSaveLetter();
  const del = useDeleteLetter();

  const [savedLocal, setSavedLocal] = useState(letter.saved);

  // 외부에서 letter 가 갱신되면 (예: cache invalidate 후 refetch) 로컬도 동기.
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
    // 삭제 직전 대기 중인 토글이 있으면 즉시 flush — 서버 상태 일관성 보장
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
      {/* Figma `Frame 25` — 156x52 두 개, gap 8 */}
      <div className={styles.row}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onDelete}
          disabled={del.isPending}
        >
          {t('delete')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onSave}
          aria-pressed={savedLocal}
        >
          {t('save')}
        </Button>
      </div>
      {/* 시안의 320x52 초록 라인 버튼 */}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        className={styles.lineButton}
        onClick={() => router.push('/letter')}
      >
        {t('backToList')}
      </Button>
    </div>
  );
}
