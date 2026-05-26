'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';

/**
 * 토너먼트 결과 클라이언트
 *
 * 컴포넌트 분할 (features/tournament/components):
 *   - <WinnerCard destination={...} />
 *   - <LuckyColor seed={winnerId} />
 *   - <LuckyLadder seed={winnerId} />
 *   - <ResultActions onSave={...} onRetry={...} />
 */
export function TournamentResultClient() {
  const router = useRouter();
  const winner = useTournamentStore((s) => s.winner);
  const reset = useTournamentStore((s) => s.reset);

  useEffect(() => {
    if (!winner) router.replace('/tournament');
  }, [winner, router]);

  if (!winner) return null;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 1) 우승 여행지 */}
      {/* TODO: <WinnerCard destination={winner} /> */}
      <Placeholder title={`🏆 ${winner.name}`} height={260} />

      {/* 2) 행운의 색 */}
      {/* TODO: <LuckyColor seed={winner.id} /> */}
      <Placeholder title="행운의 색" height={120} />

      {/* 3) 사다리타기 */}
      {/* TODO: <LuckyLadder seed={winner.id} /> */}
      <Placeholder title="여행에서 인연을 만날 확률" height={300} />

      {/* 4) 액션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button
          style={btnPrimary}
          onClick={() => {
            // TODO: POST /mypage/tournaments + toast
          }}
        >
          마이페이지에 저장
        </button>
        <button
          style={btnSecondary}
          onClick={() => {
            reset();
            router.replace('/tournament');
          }}
        >
          다시 하기
        </button>
      </div>
    </div>
  );
}

function Placeholder({ title, height }: { title: string; height: number }) {
  return (
    <div
      style={{
        height,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--color-muted)',
        fontWeight: 600,
      }}
    >
      {title}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '0.875rem',
  background: 'var(--color-primary)',
  color: 'var(--color-primary-fg)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  padding: '0.875rem',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
};
