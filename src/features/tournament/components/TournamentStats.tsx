'use client';

import { useTranslations } from 'next-intl';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import type { Destination, TournamentCount } from '@/features/tournament/types';
import styles from './TournamentStats.module.scss';

interface Props {
  winner: Destination;
  runnerUp: Destination | null;
  matchesPlayed: number;
  tournamentSize: TournamentCount | undefined;
}

// i18n strict typing (T7053) 회피용 switch — count 키 literal narrowing
function bracketSizeLabelKey(
  size: TournamentCount,
): '4' | '8' | '16' | '32' | null {
  switch (size) {
    case 4:
      return '4';
    case 8:
      return '8';
    case 16:
      return '16';
    case 32:
      return '32';
    default:
      return null;
  }
}

/**
 * 우승 결과 부가 정보 — 매치업 사이즈 / 총 매치 수 / 결승 상대 / 시군·카테고리.
 *
 * Bracket 결과로 받은 runnerUp/matchesPlayed + store config 의 tournamentSize 결합.
 * 결승전이 실제로 있었던 경우(runnerUp != null)에만 결승 상대 표기.
 */
export function TournamentStats({
  winner,
  runnerUp,
  matchesPlayed,
  tournamentSize,
}: Props) {
  const t = useTranslations('tournament');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === winner.region);
  const regionLabel = region?.ko ?? winner.region;
  const categoryLabel = t(`category.${winner.category}`);
  const runnerUpRegion = runnerUp
    ? (CHUNGBUK_REGIONS.find((r) => r.code === runnerUp.region)?.ko ??
      runnerUp.region)
    : null;
  const bracketKey =
    tournamentSize !== undefined ? bracketSizeLabelKey(tournamentSize) : null;
  const bracketLabel =
    bracketKey === '4'
      ? t('play.tournamentSize.count.4')
      : bracketKey === '8'
        ? t('play.tournamentSize.count.8')
        : bracketKey === '16'
          ? t('play.tournamentSize.count.16')
          : bracketKey === '32'
            ? t('play.tournamentSize.count.32')
            : null;

  return (
    <section className={styles.wrap} aria-label={t('result.stats.label')}>
      <ul className={styles.grid}>
        {bracketLabel && (
          <li className={styles.cell}>
            <span className={styles.cellLabel}>
              {t('result.stats.bracketSize')}
            </span>
            <span className={styles.cellValue}>{bracketLabel}</span>
          </li>
        )}
        <li className={styles.cell}>
          <span className={styles.cellLabel}>{t('result.stats.matches')}</span>
          <span className={styles.cellValue}>
            {t('result.stats.matchesValue', { n: matchesPlayed })}
          </span>
        </li>
        <li className={styles.cell}>
          <span className={styles.cellLabel}>{t('result.stats.region')}</span>
          <span className={styles.cellValue}>{regionLabel}</span>
        </li>
        <li className={styles.cell}>
          <span className={styles.cellLabel}>{t('result.stats.category')}</span>
          <span className={styles.cellValue}>{categoryLabel}</span>
        </li>
      </ul>

      {runnerUp && (
        <div className={styles.runnerUp}>
          <span className={styles.runnerUpBadge} aria-hidden>
            🥈
          </span>
          <div className={styles.runnerUpText}>
            <span className={styles.runnerUpLabel}>
              {t('result.stats.runnerUp')}
            </span>
            <span className={styles.runnerUpName}>{runnerUp.name}</span>
            <span className={styles.runnerUpRegion}>{runnerUpRegion}</span>
          </div>
        </div>
      )}
    </section>
  );
}
