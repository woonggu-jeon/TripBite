import { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import type { DestinationDto } from '@/api/generated/schemas';
import type { BracketResult } from '@/features/tournament/types';
import { Bracket, type BracketHandle } from './Bracket';

function makeDest(id: number, name?: string): DestinationDto {
  return {
    id: `d-${id}`,
    name: name ?? `dest-${id}`,
    category: 'attraction',
    region: 'cheongju',
    imageUrl: undefined,
  };
}

/**
 * Math.random 을 deterministic 시퀀스로 고정 — pairRound 의 shuffle 결과 예측 가능.
 * 0.0 으로만 채워주면 shuffle 이 사실상 reverse 에 가까운 결정적 순서.
 */
function lockShuffle() {
  vi.spyOn(Math, 'random').mockReturnValue(0);
}

describe('Bracket', () => {
  beforeEach(lockShuffle);
  afterEach(() => vi.restoreAllMocks());

  it('1명 입력 — 즉시 우승 처리', () => {
    const onComplete = vi.fn<(r: BracketResult) => void>();
    const sole = makeDest(1, '청남대');
    renderWithProviders(
      <Bracket destinations={[sole]} onComplete={onComplete} />,
    );
    // 즉시 onComplete 호출 + auto win 메시지 노출
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]?.[0].winner).toEqual(sole);
    expect(onComplete.mock.calls[0]?.[0].runnerUp).toBeNull();
    expect(onComplete.mock.calls[0]?.[0].matchesPlayed).toBe(0);
  });

  it('2명 입력 — 1 매치 → winner 클릭 시 onComplete', async () => {
    const a = makeDest(1, '청남대');
    const b = makeDest(2, '상당산성');
    const onComplete = vi.fn<(r: BracketResult) => void>();

    renderWithProviders(
      <Bracket destinations={[a, b]} onComplete={onComplete} />,
    );

    // 결승 상태 — 두 카드 모두 노출
    expect(screen.getByRole('button', { name: /청남대 선택/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /상당산성 선택/ })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /청남대 선택/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]?.[0];
    expect(result?.winner.id).toBe('d-1');
    expect(result?.runnerUp?.id).toBe('d-2');
    expect(result?.matchesPlayed).toBe(1);
  });

  it('4명 입력 — 2 매치 → 결승 1 매치 → 총 3 매치', async () => {
    const dests = [1, 2, 3, 4].map((i) => makeDest(i));
    const onComplete = vi.fn<(r: BracketResult) => void>();

    renderWithProviders(
      <Bracket destinations={dests} onComplete={onComplete} />,
    );

    // 첫 매치 winner 선택 (a 클릭)
    const firstButtons = screen.getAllByRole('button', { name: /선택$/ });
    expect(firstButtons.length).toBe(2);
    await userEvent.click(firstButtons[0] as HTMLElement);

    // 두 번째 매치 — 새 두 후보 — winner 선택
    const secondButtons = screen.getAllByRole('button', { name: /선택$/ });
    expect(secondButtons.length).toBe(2);
    await userEvent.click(secondButtons[0] as HTMLElement);

    // 이제 결승 — 두 winner 가 후보
    const finalButtons = screen.getAllByRole('button', { name: /선택$/ });
    expect(finalButtons.length).toBe(2);
    await userEvent.click(finalButtons[0] as HTMLElement);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]?.[0].matchesPlayed).toBe(3);
  });

  it('3명 입력 — 홀수라 1명 bye → 2 매치 (4명 토너먼트와 동일 결승전 도달)', async () => {
    const dests = [1, 2, 3].map((i) => makeDest(i));
    const onComplete = vi.fn<(r: BracketResult) => void>();

    renderWithProviders(
      <Bracket destinations={dests} onComplete={onComplete} />,
    );

    // 첫 라운드: 1 매치 (홀수라 1명 bye + 2명 매치업)
    const first = screen.getAllByRole('button', { name: /선택$/ });
    expect(first.length).toBe(2);
    await userEvent.click(first[0] as HTMLElement);

    // 결승전 (winner + bye)
    const finalBtns = screen.getAllByRole('button', { name: /선택$/ });
    expect(finalBtns.length).toBe(2);
    await userEvent.click(finalBtns[0] as HTMLElement);

    expect(onComplete).toHaveBeenCalledTimes(1);
    // 결정된 매치 = 2 (첫 라운드 1 + 결승 1) — bye 는 자동 진출이라 카운트 X
    expect(onComplete.mock.calls[0]?.[0].matchesPlayed).toBe(2);
  });

  it('빈 입력 — 렌더링 안 함 (null)', () => {
    const { container } = renderWithProviders(
      <Bracket destinations={[]} onComplete={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('undo — 직전에 고른 매치로 되돌아가고 그 선택이 취소된다', async () => {
    // 4명 → 1라운드 2매치. 첫 매치를 고른 뒤 undo 하면 첫 매치로 복귀.
    const dests = [1, 2, 3, 4].map((i) => makeDest(i, `d${i}`));
    const onComplete = vi.fn<(r: BracketResult) => void>();
    const ref = createRef<BracketHandle>();

    renderWithProviders(
      <Bracket ref={ref} destinations={dests} onComplete={onComplete} />,
    );

    const first = screen.getAllByRole('button', { name: /선택$/ });
    const firstNames = first.map((b) => b.getAttribute('aria-label'));
    await userEvent.click(first[0]!);

    // 2번째 매치로 넘어감 — 대전 카드가 바뀐다
    const second = screen.getAllByRole('button', { name: /선택$/ });
    expect(second.map((b) => b.getAttribute('aria-label'))).not.toEqual(
      firstNames,
    );

    // undo → 첫 매치 카드가 다시 보이고, 되돌릴 게 있었으니 true.
    // ref 호출은 React 이벤트 밖이라 act 로 감싸 상태 갱신을 flush 한다.
    let undone: boolean | undefined;
    await act(async () => {
      undone = ref.current?.undo();
    });
    expect(undone).toBe(true);

    const back = screen.getAllByRole('button', { name: /선택$/ });
    expect(back.map((b) => b.getAttribute('aria-label'))).toEqual(firstNames);

    // 첫 매치에서 다시 undo — 되돌릴 게 없어 false
    expect(ref.current?.undo()).toBe(false);
  });
});
