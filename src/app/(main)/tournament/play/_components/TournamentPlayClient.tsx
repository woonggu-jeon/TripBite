'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CenterIllustration } from '@/features/tournament/components/CenterIllustration';
import { FallingPetals } from '@/features/tournament/components/FallingPetals';
import { ChungbukMap } from '@/features/tournament/components/ChungbukMap';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import { useTournamentCandidates } from '@/features/tournament/hooks/use-tournament';
import styles from './TournamentPlayClient.module.scss';

type Phase = 'illustration' | 'map' | 'bracket';

/**
 * 토너먼트 진행 클라이언트
 *
 *   1) illustration : 중앙 일러스트 + 계절 파티클 → 탭 → map
 *   2) map          : 충북 지도 위로 N개 일러스트 낙하 → 토너먼트 시작 → bracket
 *   3) bracket      : 1:1 매치업 (Phase 3에서 본격 구현, 현재는 placeholder)
 *
 * 설정 없이 직접 진입한 경우(새로고침 등)는 안내 메시지 + 설정 화면 진입 버튼.
 * (백엔드 미연결 단계: 자동 redirect 대신 안내 표시.)
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const t = useTranslations('tournament.play');
  const config = useTournamentStore((s) => s.config);
  const setWinner = useTournamentStore((s) => s.setWinner);

  const [phase, setPhase] = useState<Phase>('illustration');
  const [tapped, setTapped] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const {
    data: destinations,
    isLoading,
    isError,
    refetch,
  } = useTournamentCandidates(config);

  if (!config) {
    return (
      <div className={styles.empty}>
        <p>{t('noConfig')}</p>
        <button
          type="button"
          className={styles.cta}
          onClick={() => router.replace('/tournament')}
        >
          {t('goSetup')}
        </button>
      </div>
    );
  }

  const theme = config.theme;

  const handleTap = () => {
    if (!destinations || destinations.length === 0) return;
    setTapped(true);
    window.setTimeout(() => setPhase('map'), 500);
  };

  const handleStartBracket = () => {
    setPhase('bracket');
  };

  const handleFinishPlaceholder = () => {
    // Phase 3 구현 전 임시: 첫 번째 후보를 우승자로 지정하고 결과로 이동
    const first = destinations?.[0];
    if (first) setWinner(first);
    router.replace('/tournament/result');
  };

  return (
    <div className={styles.wrap}>
      {/* 계절 파티클 — illustration/map 페이즈에서만 표시 */}
      {theme.kind === 'season' && phase !== 'bracket' && (
        <FallingPetals season={theme.value} active />
      )}

      {phase === 'illustration' && (
        <div className={styles.center}>
          <CenterIllustration
            theme={theme}
            onTap={handleTap}
            tapped={tapped}
            disabled={isLoading || isError || !destinations}
          />
          <p className={styles.hint}>
            {isLoading ? t('loading') : isError ? t('error') : t('tapToStart')}
          </p>
          {isError && (
            <button
              type="button"
              className={styles.retry}
              onClick={() => refetch()}
            >
              {t('retry')}
            </button>
          )}
        </div>
      )}

      {phase === 'map' && destinations && (
        <div className={styles.map}>
          <ChungbukMap
            destinations={destinations}
            theme={theme}
            onReady={() => setMapReady(true)}
          />
          <div className={styles.mapFooter}>
            <p className={styles.mapHint}>
              {mapReady ? t('mapReady') : t('mapDropping')}
            </p>
            <button
              type="button"
              className={styles.cta}
              disabled={!mapReady}
              onClick={handleStartBracket}
            >
              {t('startBracket')}
            </button>
          </div>
        </div>
      )}

      {phase === 'bracket' && (
        <div className={styles.bracketPlaceholder}>
          <p className={styles.placeholderTitle}>{t('bracketTodoTitle')}</p>
          <p className={styles.placeholderHint}>{t('bracketTodoHint')}</p>
          <button
            type="button"
            className={styles.cta}
            onClick={handleFinishPlaceholder}
          >
            {t('toResult')}
          </button>
        </div>
      )}
    </div>
  );
}
