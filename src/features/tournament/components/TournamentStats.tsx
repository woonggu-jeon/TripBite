'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import type { DestinationDto } from '@/api/generated/schemas';
import type { TournamentCount } from '@/features/tournament/types';
import styles from './TournamentStats.module.scss';

interface Props {
  winner: DestinationDto;
  /** Figma 정합 spec 에서 chip 4 슬롯만 노출 — runnerUp UI 제외. prop 만 유지(호출부 호환). */
  runnerUp: DestinationDto | null;
  matchesPlayed: number;
  tournamentSize: TournamentCount | undefined;
}

// i18n strict typing (T7053) 회피용 switch — count 키 literal narrowing
function bracketSizeShortLabel(size: TournamentCount): string {
  switch (size) {
    case 4:
      return '4강';
    case 8:
      return '8강';
    case 16:
      return '16강';
    case 32:
      return '32강';
    default:
      return '';
  }
}

/** LuckyColor 와 동일 hash — 같은 destination 우승 시 동일 색. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  const ll = l / 100;
  const a = (s * Math.min(ll, 1 - ll)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

type ColorKey =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

const HUE_BANDS: { max: number; key: ColorKey }[] = [
  { max: 30, key: 'red' },
  { max: 60, key: 'orange' },
  { max: 90, key: 'yellow' },
  { max: 150, key: 'green' },
  { max: 210, key: 'teal' },
  { max: 270, key: 'blue' },
  { max: 330, key: 'purple' },
  { max: 360, key: 'pink' },
];

function colorKeyFromHue(h: number): ColorKey {
  return HUE_BANDS.find((b) => h < b.max)?.key ?? 'pink';
}

/**
 * Frame 47 — Figma "TRN · 토너먼트 결과" 토너먼트 기록 정합.
 *
 * 구성 (column gap 12):
 *   - title B_16 fg "토너먼트 기록"
 *   - Frame 46 column gap 12:
 *     · chips row gap 8 — 4 rchip 74×59 (column align center padding 12 4) +
 *       secondary01 bg + primary border + radius 12:
 *         · B_14 primary 숫자 (matchesPlayed / bracketSize / region(생략) / category)
 *         · sp 3
 *         · Caption M_10 muted 라벨
 *     · lucky row padding 14 16 + secondary01 + primary border + radius 12:
 *         · B_14 fg "이번 행운의 색" (왼쪽)
 *         · lucky-r row gap 8 — B_14 fg 색이름 + circle 20 색 bg (오른쪽)
 *
 * runnerUp 정보는 Figma 정합 spec 에서 제외 — chip 4 슬롯이 더 우선.
 * 보유 데이터: bracketSize / matchesPlayed / region / category 4 슬롯.
 */
export function TournamentStats({
  winner,
  runnerUp: _runnerUp,
  matchesPlayed,
  tournamentSize,
}: Props) {
  const t = useTranslations('tournament');
  const tColor = useTranslations('tournament.result.color');
  const region = CHUNGBUK_REGIONS.find((r) => r.code === winner.region);
  const regionLabel = region?.ko ?? winner.region;
  const categoryLabel = t(`category.${winner.category}`);
  const bracketLabel =
    tournamentSize !== undefined ? bracketSizeShortLabel(tournamentSize) : '';

  const { hex, colorName } = useMemo(() => {
    const h = hashSeed(winner.id) % 360;
    const key = colorKeyFromHue(h);
    return { hex: hslToHex(h, 70, 55), colorName: tColor(key) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner.id]);

  const chips: { key: string; value: string; label: string }[] = [];
  if (bracketLabel)
    chips.push({
      key: 'bracket',
      value: bracketLabel,
      label: t('result.stats.bracketSize'),
    });
  chips.push({
    key: 'matches',
    value: `${matchesPlayed}`,
    label: t('result.stats.matches'),
  });
  chips.push({
    key: 'region',
    value: regionLabel,
    label: t('result.stats.region'),
  });
  chips.push({
    key: 'category',
    value: categoryLabel,
    label: t('result.stats.category'),
  });

  return (
    <section className={styles.wrap} aria-label={t('result.stats.label')}>
      <h3 className={styles.title}>{t('result.stats.title')}</h3>

      <div className={styles.chips}>
        {chips.slice(0, 4).map((c) => (
          <div key={c.key} className={styles.chip}>
            <span className={styles.chipValue}>{c.value}</span>
            <span className={styles.chipLabel}>{c.label}</span>
          </div>
        ))}
      </div>

      <div
        className={styles.luckyRow}
        aria-label={`${tColor('label')}: ${colorName}`}
      >
        <span className={styles.luckyLabel}>{tColor('label')}</span>
        <span className={styles.luckyValue}>
          <span className={styles.luckyName}>{colorName}</span>
          <span
            className={styles.luckySwatch}
            style={{ background: hex }}
            aria-hidden
          />
        </span>
      </div>
    </section>
  );
}
