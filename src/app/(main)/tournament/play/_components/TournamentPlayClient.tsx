'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';

type Phase = 'illustration' | 'map' | 'bracket';

/**
 * 토너먼트 진행 클라이언트
 *
 * 페이즈 전환:
 *   illustration → (메인 일러스트 클릭) → map → (지도에 일러스트 떨어짐 완료) → bracket
 *
 * 컴포넌트 분할 (features/tournament/components):
 *   - <SeasonalCenterIllustration onTap={...} />
 *   - <FallingPetals season={season} />
 *   - <ChungbukMap items={selected} />
 *   - <Bracket rounds={...} onWinner={...} />
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const config = useTournamentStore((s) => s.config);
  const [phase, setPhase] = useState<Phase>('illustration');

  // 설정 없이 진입한 경우 (새로고침 등) → 설정 화면으로 복귀
  useEffect(() => {
    if (!config) {
      router.replace('/tournament');
    }
  }, [config, router]);

  if (!config) return null;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {phase === 'illustration' && (
        <div
          style={{
            minHeight: 420,
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-muted)',
          }}
          onClick={() => setPhase('map')}
        >
          {/* TODO: <SeasonalCenterIllustration season={config.season} /> */}
          계절 일러스트 (탭하면 흩날림 + 지도로 이동)
        </div>
      )}

      {phase === 'map' && (
        <div
          style={{
            minHeight: 420,
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-muted)',
          }}
        >
          {/* TODO: <ChungbukMap count={config.count} season={config.season}
                      onReady={() => setPhase('bracket')} /> */}
          충청북도 지도 + 일러스트 낙하 애니메이션
          <button onClick={() => setPhase('bracket')}>토너먼트 시작</button>
        </div>
      )}

      {phase === 'bracket' && (
        <div
          style={{
            minHeight: 420,
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-muted)',
          }}
        >
          {/* TODO: <Bracket onComplete={(winner) => {
                      useTournamentStore.getState().setWinner(winner);
                      router.replace('/tournament/result');
                    }} /> */}
          1:1 매치업 카드
          <button onClick={() => router.replace('/tournament/result')}>
            결승 결과로
          </button>
        </div>
      )}
    </div>
  );
}
