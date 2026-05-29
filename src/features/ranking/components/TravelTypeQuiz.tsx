'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { haptic } from '@/lib/haptic';
import {
  useSubmitTravelType,
  useTravelTypeQuiz,
} from '@/features/ranking/hooks/use-ranking';
import type { TravelTypeAnswer } from '@/features/ranking/types';
import styles from './TravelTypeQuiz.module.scss';

/**
 * 여행 유형 테스트 진행 화면.
 *
 * 동작:
 *   - GET /travel-types/quiz 로 questions/options 받아 한 문항씩 노출 (stepper)
 *   - 옵션 선택 즉시 다음 문항으로 진행 (한 번 더 누르면 변경 가능 — 직전 문항 단계에서)
 *   - 모든 문항 답변 시 POST /travel-types/submit → 결과는 cache 에 저장 + /travel-type/result 이동
 *   - 진행률 dot + 뒤로/현재/총 문항 수 노출
 *
 * 데이터 의존:
 *   - quiz 데이터는 서버 contract — 컴포넌트는 옵션의 점수 의미를 알지 않음
 *   - 점수 계산 / 유형 결정 / 추천 선정은 모두 submit 응답 책임
 */
export function TravelTypeQuiz() {
  const t = useTranslations('travelType');
  const router = useRouter();
  const { data: quiz, isLoading, isError, refetch } = useTravelTypeQuiz();
  const submit = useSubmitTravelType();

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<TravelTypeAnswer[]>([]);

  if (isLoading) {
    return <div className={styles.fallback}>{t('loading')}</div>;
  }
  if (isError || !quiz || quiz.questions.length === 0) {
    return (
      <div className={styles.fallback}>
        <p>{t('error')}</p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => refetch()}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const total = quiz.questions.length;
  const current = quiz.questions[stepIdx];
  if (!current) return null;
  const currentAnswer = answers.find((a) => a.questionId === current.id);

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
    // 마지막 문항 — submit
    haptic.success();
    submit.mutate(next, {
      onSuccess: () => router.replace('/quiz/result'),
    });
  };

  const handleBack = () => {
    if (stepIdx === 0) {
      router.back();
      return;
    }
    haptic.tap();
    setStepIdx(stepIdx - 1);
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <button
          type="button"
          className={styles.back}
          onClick={handleBack}
          aria-label={t('back')}
        >
          <ChevronLeft size={22} />
        </button>
        <span className={styles.progressText}>
          {t('progress', { current: stepIdx + 1, total })}
        </span>
        <div className={styles.dots} aria-hidden>
          {quiz.questions.map((q, i) => (
            <span
              key={q.id}
              className={
                i === stepIdx
                  ? `${styles.dot} ${styles.dotActive}`
                  : i < stepIdx
                    ? `${styles.dot} ${styles.dotDone}`
                    : styles.dot
              }
            />
          ))}
        </div>
      </header>

      <h2 className={styles.question}>{current.text}</h2>

      <ul
        className={styles.options}
        role="radiogroup"
        aria-label={current.text}
      >
        {current.options.map((opt) => {
          const active = currentAnswer?.optionId === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.option} ${active ? styles.optionActive : ''}`}
                onClick={() => handlePick(opt.id)}
                disabled={submit.isPending}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>

      {submit.isPending && (
        <p className={styles.submitting} aria-live="polite">
          {t('submitting')}
        </p>
      )}
      {submit.isError && (
        <p className={styles.submitError} role="alert">
          {t('submitError')}
        </p>
      )}
    </div>
  );
}
