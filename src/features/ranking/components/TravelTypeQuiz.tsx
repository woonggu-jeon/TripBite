'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button, RadioGroup, RadioOption } from '@/components/ui';
import {
  useSubmitTravelType,
  useTravelTypeQuiz,
} from '@/features/ranking/hooks/use-ranking';
import type { TravelTypeAnswer } from '@/features/ranking/types';
import { shuffleQuizOptions } from '@/features/ranking/utils/shuffle-options';
import type { QuizOptionDto } from '@/api/generated/schemas';
import styles from './TravelTypeQuiz.module.scss';

/**
 * 여행 유형 테스트 진행 화면.
 *
 * 흐름:
 *   1) questions phase — 한 문항씩 노출, 옵션 선택 즉시 다음
 *   2) 마지막 답변 → submit.mutate → submitting phase (단일)
 *   3) onSuccess 즉시 /quiz/result 이동 — 인위적 지연 없음
 *
 * 진행 표시:
 *   - 토너먼트 Bracket 와 동일한 segment 점선 형태
 *   - 답변한 문항(또는 현재까지의 진행) segment 는 클릭 가능 → 해당 질문으로 점프
 *   - 미답변 미래 문항은 잠금
 *
 * 페이지 SubHeader 가 이미 뒤로가기를 담당 — 자체 back 버튼 미노출.
 *
 * 데이터 의존:
 *   - quiz/submit/me 모두 서버 응답 그대로 렌더
 *   - 점수 계산 / 유형 결정 / 추천 선정 로직 보유 X
 */
export function TravelTypeQuiz() {
  const t = useTranslations('travelType');
  const router = useRouter();
  const { data: quiz, isLoading, isError, refetch } = useTravelTypeQuiz();
  const submit = useSubmitTravelType();

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<TravelTypeAnswer[]>([]);
  // 옵션 순서 셔플 — 위치 편향 제거. quiz 세션 동안 stable (재셔플 X).
  // SSR/CSR mismatch 회피 위해 useEffect 안에서만 Math.random 사용.
  const [shuffledOptions, setShuffledOptions] = useState<
    Record<string, QuizOptionDto[]>
  >({});
  useEffect(() => {
    if (!quiz?.questions) return;
    setShuffledOptions(shuffleQuizOptions(quiz.questions));
  }, [quiz]);

  if (isLoading) {
    return (
      <div className={styles.fallback} role="status" aria-label={t('loading')}>
        <Skeleton width="100%" height={180} radius="lg" />
        <Skeleton width="100%" height={56} radius="md" />
        <Skeleton width="100%" height={56} radius="md" />
      </div>
    );
  }
  if (isError || !quiz || quiz.questions.length === 0) {
    return (
      <EmptyState
        icon={
          <span aria-hidden style={{ fontSize: 28 }}>
            📭
          </span>
        }
        title={t('emptyTitle')}
        description={t('emptyHint')}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  // submit 진행 중 — 결과 만드는 중 (응답 즉시 router.replace 라 단일 phase)
  if (submit.isPending) {
    return (
      <div className={styles.finishing} role="status" aria-live="polite">
        <div className={styles.finishingGlow} aria-hidden />
        <div className={styles.finishingEmoji} aria-hidden>
          ✨
        </div>
        <p className={styles.finishingTitle}>{t('finishing.making')}</p>
        <p className={styles.finishingHint}>{t('finishing.moving')}</p>
      </div>
    );
  }

  const total = quiz.questions.length;
  const current = quiz.questions[stepIdx];
  if (!current) return null;
  const currentAnswer = answers.find((a) => a.questionId === current.id);

  // 점프 가능 인덱스 = 이미 답변했거나 현재 step 이전. 미래 문항은 잠금.
  const answeredIds = new Set(answers.map((a) => a.questionId));
  const canJumpTo = (idx: number) => {
    if (idx === stepIdx) return false;
    if (idx < stepIdx) return true;
    const q = quiz.questions[idx];
    return !!q && answeredIds.has(q.id);
  };

  const handlePick = (optionId: string) => {
    haptic.tap();
    const next: TravelTypeAnswer[] = (() => {
      const without = answers.filter((a) => a.questionId !== current.id);
      return [...without, { questionId: current.id, optionId }];
    })();
    setAnswers(next);

    if (stepIdx < total - 1) {
      setStepIdx(stepIdx + 1);
      return;
    }
    // 마지막 문항 — submit 후 응답 즉시 result 이동
    haptic.success();
    submit.mutate(next, {
      onSuccess: () => router.replace('/quiz/result'),
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.progressSection}>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={stepIdx + 1}
          aria-label={t('progressLabel')}
        >
          {quiz.questions.map((q, i) => {
            const isCurrent = i === stepIdx;
            const isDone = answeredIds.has(q.id);
            const canJump = canJumpTo(i);
            const cls = [
              styles.seg,
              isDone && !isCurrent ? styles.segDone : '',
              isCurrent ? styles.segCurrent : '',
              canJump ? styles.segClickable : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={q.id}
                type="button"
                className={cls}
                onClick={() => {
                  if (!canJump) return;
                  haptic.tap();
                  setStepIdx(i);
                }}
                disabled={!canJump}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={t('jumpTo', { n: i + 1 })}
              />
            );
          })}
        </div>
        <p className={styles.progressMeta}>
          <span className={styles.progressIndex}>
            {t('progress', { current: stepIdx + 1, total })}
          </span>
          <span className={styles.progressHint}>
            <Info size={12} aria-hidden /> {t('progressHint')}
          </span>
        </p>
      </div>

      <h2 className={styles.question}>{current.text}</h2>

      <RadioGroup label={current.text} className={styles.options}>
        {(shuffledOptions[current.id] ?? current.options).map((opt) => {
          const active = currentAnswer?.optionId === opt.id;
          return (
            <RadioOption
              key={opt.id}
              checked={active}
              onSelect={() => handlePick(opt.id)}
              // ios safari 안전망 — tap 후 focus 가 button 에 남으면 다음 question
              // 의 같은 위치 옵션이 강조된 듯 보임. Bracket fix 와 동일.
              blurOnClick
              // progress segment 로 이전 문항 점프 후 같은 답 재클릭 시에도
              // 다음 단계로 진행 (confirm 시나리오) — 기본 idempotent 무시.
              allowReselect
              className={`${styles.option} ${active ? styles.optionActive : ''}`}
            >
              {opt.text}
            </RadioOption>
          );
        })}
      </RadioGroup>

      {submit.isError && (
        <p className={styles.submitError} role="alert">
          {t('submitError')}
        </p>
      )}
    </div>
  );
}
