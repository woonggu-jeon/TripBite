'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CenterIllustration } from '@/features/tournament/components/CenterIllustration';
import { FallingPetals } from '@/features/tournament/components/FallingPetals';
import { ChungbukMap } from '@/features/tournament/components/ChungbukMap';
import { CountSelector } from '@/features/tournament/components/CountSelector';
import { Bracket } from '@/features/tournament/components/Bracket';
import type { DestinationDto } from '@/api/generated/schemas';
import type {
  BracketResult,
  TournamentCount,
} from '@/features/tournament/types';
import { useTournamentStore } from '@/features/tournament/store/tournament-store';
import {
  useRecordTournament,
  useTournamentCandidates,
} from '@/features/tournament/hooks/use-tournament';
import { Button, ButtonGrid } from '@/components/ui';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { toast } from '@/lib/toast';
import styles from './TournamentPlayClient.module.scss';

type Phase = 'intro' | 'map' | 'tournamentSize' | 'bracket' | 'celebration';

const INTRO_MS = 2500;
const CELEBRATION_MS = 1800;

/**
 * 충북 11 시군에서 N 개 random pick. Fisher–Yates.
 * config.region (단일 시군 한정) 있으면 그것만 반환.
 * count > 11 이면 11개 전체 반환.
 */
function pickRandomRegions(config: {
  count: number;
  region?: string;
}): string[] {
  if (config.region) return [config.region];
  const codes = CHUNGBUK_REGIONS.map((r) => r.code).slice();
  for (let i = codes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ci = codes[i];
    const cj = codes[j];
    if (ci !== undefined && cj !== undefined) {
      codes[i] = cj;
      codes[j] = ci;
    }
  }
  return codes.slice(0, Math.min(config.count, codes.length));
}

/**
 * 토너먼트 진행 클라이언트
 *
 *   1) intro          : 중앙 일러스트 + 계절 파티클 (자동 2.5초 → map)
 *   2) map            : 충북 지도 + N 시군 random pick → store.setSelectedRegions
 *                       → ChungbukMap 에 시군 표식 → "다음" → tournamentSize
 *   3) tournamentSize : 4/8/16/32 선택 → store.setTournamentSize
 *                       → fetch 트리거 (regions + tournamentSize 모두 충족) → bracket
 *   4) bracket        : BE 응답 destinations 로 1:1 매치업
 *
 * fetch 시점: tournamentSize 결정 후 (selectedRegions + tournamentSize 모두 set).
 * BE 가 시군을 query 로 받으므로, FE 가 먼저 N 시군 결정해야 함.
 *
 * 설정 없이 직접 진입 시 자동 redirect 대신 안내 + 설정 화면 진입 버튼.
 *
 * 사용자 요구:
 *   - 토너먼트 데이터(여행유형 + 여행지 + 토너먼트 수)는 API 호출 파라미터로 전달
 *   - tournamentSize 는 Play 의 별도 phase 에서 결정 (Setup 에서는 결정 X)
 *   - 지도 꽃잎은 자동(선택 X 필수)
 *
 * ─────────────────────────────────────────────────────────────
 * [FUTURE: BE(NestJS) 연동 시 처리 포인트]
 *
 * 현재 토너먼트는 100% 클라이언트 상태:
 *   - config 만 useTournamentCandidates(config) 로 후보 N개 fetch
 *   - 매치 결과(setBracketResult), 우승자(setWinner) 모두 store-only
 *   - reload 하면 모든 진행 상태가 사라짐
 *
 * BE 연동 시:
 *   1) Play 진입 → `POST /tournaments` (config 전송) → tournamentId 반환
 *      → tournamentId 를 URL `?tid=` 또는 store 에 보관
 *   2) 각 match 종료마다 `PATCH /tournaments/:tid/matches`
 *      또는 마지막에 한 번 `PATCH /tournaments/:tid/complete { bracketResult }`
 *      (네트워크 비용/UX 트레이드오프 — 후자 추천)
 *   3) celebration 단계 후 `router.replace('/tournament/result?tid={id}')`
 *      → 결과 페이지가 deep-link 진입을 지원하게 됨 (위 결과 페이지 메모 참조)
 *
 * 정책 [[rendering-speed-first]]: bracket 진행 중에는 추가 fetch 금지 —
 *   서버 동기화는 fire-and-forget 으로, UI 는 store 기준으로 즉시 진행.
 *   (네트워크 실패 시 토너먼트 완주 자체를 막지 않음. retry queue 권장.)
 * ─────────────────────────────────────────────────────────────
 */
export function TournamentPlayClient() {
  const router = useRouter();
  const t = useTranslations('tournament.play');
  const config = useTournamentStore((s) => s.config);
  const setSelectedRegions = useTournamentStore((s) => s.setSelectedRegions);
  const setTournamentSize = useTournamentStore((s) => s.setTournamentSize);
  const setBracketResult = useTournamentStore((s) => s.setBracketResult);
  const record_ = useRecordTournament();

  const [phase, setPhase] = useState<Phase>('intro');
  const [pendingSize, setPendingSize] = useState<TournamentCount | null>(null);
  const [pendingResult, setPendingResult] = useState<BracketResult | null>(
    null,
  );
  const pendingWinner = pendingResult?.winner ?? null;

  const {
    data: pool,
    isLoading,
    isError,
    refetch,
  } = useTournamentCandidates(config);

  // intro 자동 진행 → map phase.
  useEffect(() => {
    if (!config || phase !== 'intro') return;
    const id = window.setTimeout(() => setPhase('map'), INTRO_MS);
    return () => window.clearTimeout(id);
  }, [config, phase]);

  // map phase 진입 시 N 시군 random pick (충북 11 시군 중).
  //   - config.region (단일 시군 한정) 이 있으면 그것만 사용
  //   - 이미 selectedRegions 있으면 그대로 (reshuffle 이 별도 트리거)
  useEffect(() => {
    if (!config || phase !== 'map') return;
    if (config.selectedRegions && config.selectedRegions.length > 0) return;
    setSelectedRegions(pickRandomRegions(config));
  }, [config, phase, setSelectedRegions]);

  // celebration → result 자동 이동.
  // - bracket 종료 → record mutation (fire-and-forget) → record.id 받아 ?id= 로 전달.
  //   실패해도 store 만으로 result 페이지 동작 가능 — silent fail.
  useEffect(() => {
    if (phase !== 'celebration' || !pendingResult) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced ? 400 : CELEBRATION_MS;
    const id = window.setTimeout(async () => {
      setBracketResult(pendingResult);
      // POST /tournaments — record id 받아 deep-link 가능하게 URL 에 박음.
      // 실패 시 id 없이 그냥 store-only result 페이지 이동.
      let recordId: string | undefined;
      try {
        const record = await record_.mutateAsync({
          winnerId: pendingResult.winner.id,
          runnerUpId: pendingResult.runnerUp?.id ?? null,
          matchesPlayed: pendingResult.matchesPlayed,
          tournamentSize: config?.tournamentSize ?? matchupSize,
        });
        recordId = record.id;
      } catch {
        // store 만으로 result 진입 — UX 끊김 방지. 단, 사용자에게 저장 실패는 알림.
        toast.error(t('recordFailedToast'));
      }
      router.replace(
        recordId
          ? `/tournament/result?id=${encodeURIComponent(recordId)}`
          : '/tournament/result',
      );
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pendingResult, setBracketResult, router]);

  // map phase 시각화 — selectedRegions 기반 placeholder DestinationDto[].
  //   - fetch 가 tournamentSize 결정 후라 이 시점엔 실 destinations 없음
  //   - 지도에 시군 위치 표식만 보이면 충분 (이름/카테고리는 config 에서 차용)
  const N = config?.count ?? 0;
  const mapPlaceholders = useMemo<DestinationDto[]>(() => {
    if (!config?.selectedRegions?.length) return [];
    const cat = config.categories[0] ?? 'attraction';
    return config.selectedRegions.map((code) => {
      const region = CHUNGBUK_REGIONS.find((r) => r.code === code);
      // selectedRegions 는 충북 11 시군 코드만 — find 실패해도 첫번째 (cheongju) fallback.
      const safeCode = region?.code ?? 'cheongju';
      return {
        id: `placeholder-${safeCode}`,
        name: region?.ko ?? safeCode,
        category: cat,
        region: safeCode,
      };
    });
  }, [config?.selectedRegions, config?.categories]);

  // bracket 진입 시 매치업 destinations 구성.
  // 1단계: 시군 unique 우선 — 같은 시군의 다른 destination 두 개가 매치업에 나오는 걸 피함
  // 2단계: tournamentSize > 시군 unique 갯수면, 같은 시군의 남은 destination 으로 채움
  // id 중복은 절대 허용 X — Bracket 이 같은 카드 두 번 그리는 사고 차단.
  const matchupSize = config?.tournamentSize ?? pendingSize ?? 0;
  const matchupDestinations = useMemo<DestinationDto[]>(() => {
    if (!pool || matchupSize <= 0) return [];
    const seenRegions = new Set<string>();
    const seenIds = new Set<string>();
    const picked: DestinationDto[] = [];
    for (const d of pool) {
      if (seenRegions.has(d.region)) continue;
      seenRegions.add(d.region);
      seenIds.add(d.id);
      picked.push(d);
      if (picked.length >= matchupSize) return picked;
    }
    for (const d of pool) {
      if (seenIds.has(d.id)) continue;
      seenIds.add(d.id);
      picked.push(d);
      if (picked.length >= matchupSize) break;
    }
    return picked;
  }, [pool, matchupSize]);

  if (!config) {
    return (
      <div className={styles.empty}>
        <p>{t('noConfig')}</p>
        <Button variant="primary" onClick={() => router.replace('/tournament')}>
          {t('goSetup')}
        </Button>
      </div>
    );
  }

  const theme = config.theme;

  // map "다음" — N 시군 확정 후 tournamentSize phase 로.
  const handleMapNext = () => {
    setPhase('tournamentSize');
  };

  // map "다시하기" — N 시군 random 재추첨 (fetch 와 무관, store 갱신).
  const handleReshuffle = () => {
    if (!config) return;
    setSelectedRegions(pickRandomRegions(config));
  };

  // tournamentSize 결정 → store.setTournamentSize → useTournamentCandidates 가
  // enabled (regions + size 둘 다 set) → fetch 1회 → bracket.
  const handleConfirmSize = () => {
    if (!pendingSize) return;
    setTournamentSize(pendingSize);
    setPhase('bracket');
  };

  const handleBracketComplete = (result: BracketResult) => {
    // 즉시 result 이동 X — celebration phase 에서 1.8s 우승자 강조 후 자동 이동.
    setPendingResult(result);
    setPhase('celebration');
  };

  // 여행지 수(N)와 토너먼트 수(M)는 독립. 매치업 destinations 은 풀에서 random M개.
  const canStartBracket = pendingSize !== null;

  return (
    <div className={styles.wrap}>
      {theme.kind === 'season' && (phase === 'intro' || phase === 'map') && (
        <FallingPetals season={theme.value} active />
      )}

      {phase === 'intro' && (
        <div className={styles.center}>
          <CenterIllustration theme={theme} onTap={() => {}} disabled />
          <p className={styles.hint}>{t('introHint')}</p>
        </div>
      )}

      {phase === 'map' && (
        <div className={styles.map}>
          {mapPlaceholders.length > 0 && (
            <>
              {/* 자동 표시 — 사용자 선택 X. fetch 전 placeholder 로 시군 위치만 시각화 */}
              <ChungbukMap destinations={mapPlaceholders} theme={theme} />
              <div className={styles.mapFooter}>
                <p className={styles.counter}>
                  {t('mapSummary', { destinations: N })}
                </p>
                <ButtonGrid>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={handleReshuffle}
                  >
                    {t('reshuffle')}
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleMapNext}
                  >
                    {t('next')}
                  </Button>
                </ButtonGrid>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'tournamentSize' && (
        <div className={styles.sizePhase}>
          <h2 className={styles.sizeTitle}>{t('tournamentSize.title')}</h2>
          <p className={styles.sizeHint}>{t('tournamentSize.hint')}</p>
          <CountSelector
            value={pendingSize}
            onChange={setPendingSize}
            mode="tournament"
          />
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!canStartBracket}
            onClick={handleConfirmSize}
          >
            {t('next')}
          </Button>
        </div>
      )}

      {phase === 'bracket' && (
        <div className={styles.bracket}>
          {isLoading && <p className={styles.hint}>{t('loading')}</p>}
          {isError && (
            <div className={styles.errorBox}>
              <p>{t('error')}</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('retry')}
              </Button>
            </div>
          )}
          {/* 빈 풀 — BE 응답 0건 또는 매치업 못 만드는 조합 (예: 시군+카테고리 교집합 없음) */}
          {!isLoading &&
            !isError &&
            pool &&
            matchupDestinations.length === 0 && (
              <EmptyState
                icon={
                  <span aria-hidden style={{ fontSize: 32 }}>
                    🗺️
                  </span>
                }
                title={t('emptyPool.title')}
                description={t('emptyPool.hint')}
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.replace('/tournament')}
                  >
                    {t('emptyPool.back')}
                  </Button>
                }
              />
            )}
          {matchupDestinations.length > 0 && (
            <Bracket
              destinations={matchupDestinations}
              onComplete={handleBracketComplete}
            />
          )}
        </div>
      )}

      {phase === 'celebration' && pendingWinner && (
        <div className={styles.celebration} role="status" aria-live="polite">
          <div className={styles.celebGlow} aria-hidden />
          <div className={styles.celebTrophy} aria-hidden>
            🏆
          </div>
          <p className={styles.celebTitle}>{t('celebration.title')}</p>
          <p className={styles.celebName}>{pendingWinner.name}</p>
          <p className={styles.celebRegion}>{pendingWinner.region}</p>
          <span className={styles.celebSparkle1} aria-hidden>
            ✦
          </span>
          <span className={styles.celebSparkle2} aria-hidden>
            ✦
          </span>
          <span className={styles.celebSparkle3} aria-hidden>
            ✧
          </span>
        </div>
      )}
    </div>
  );
}
