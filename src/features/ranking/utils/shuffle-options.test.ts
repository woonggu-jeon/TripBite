import { describe, expect, it } from 'vitest';
import type { QuizQuestionDto } from '@/api/generated/schemas';
import { shuffle, shuffleQuizOptions } from './shuffle-options';

describe('shuffle', () => {
  it('원본 배열 변경하지 않음 (immutability)', () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
    expect(out).toHaveLength(5);
  });

  it('모든 원소 보존 (loss 없음)', () => {
    const src = ['a', 'b', 'c', 'd'];
    const out = shuffle(src);
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('빈 배열 / 단일 원소도 안전', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });
});

describe('shuffleQuizOptions', () => {
  const questions: QuizQuestionDto[] = [
    {
      id: 'q1',
      text: 'Q1',
      options: [
        { id: 'q1-a', text: 'A' },
        { id: 'q1-b', text: 'B' },
        { id: 'q1-c', text: 'C' },
      ],
    },
    {
      id: 'q2',
      text: 'Q2',
      options: [
        { id: 'q2-a', text: 'A' },
        { id: 'q2-b', text: 'B' },
      ],
    },
  ];

  it('각 question.id → 셔플된 options 매핑 반환', () => {
    const map = shuffleQuizOptions(questions);
    expect(Object.keys(map)).toEqual(['q1', 'q2']);
    expect(map['q1']).toHaveLength(3);
    expect(map['q2']).toHaveLength(2);
  });

  it('각 question 의 options 가 모두 보존 (id 기준)', () => {
    const map = shuffleQuizOptions(questions);
    expect(map['q1']?.map((o) => o.id).sort()).toEqual([
      'q1-a',
      'q1-b',
      'q1-c',
    ]);
    expect(map['q2']?.map((o) => o.id).sort()).toEqual(['q2-a', 'q2-b']);
  });

  it('원본 questions 변경하지 않음', () => {
    const before = JSON.stringify(questions);
    shuffleQuizOptions(questions);
    expect(JSON.stringify(questions)).toBe(before);
  });
});
