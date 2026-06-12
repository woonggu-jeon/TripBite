'use client';

import type { Season } from '@/api/generated/schemas';
import styles from './SeasonalCenterIllustration.module.scss';

/**
 * <SeasonalCenterIllustration />
 *
 * 시즌별 SVG 일러스트 — 토너먼트 setup / play 의 시각 강화용.
 *
 * 현재 구현: 시즌 그라데이션 배경 + 시즌 글리프 + 작은 장식 (꽃잎/눈송이/잎/우산).
 * 디자이너 시안 받으면 SVG asset 으로 교체. emoji 는 fallback.
 *
 * `CenterIllustration` 과 별개 — 자체 button 이 아니라 정적 illustration.
 * 추후 `CenterIllustration` 안에서 SVG 배경으로 사용하거나 단독 노출 가능.
 */

const SEASON_GLYPH: Record<Season, string> = {
  spring: '🌸',
  summer: '☂️',
  autumn: '🍁',
  winter: '⛄',
};

export function SeasonalCenterIllustration({ season }: { season: Season }) {
  const glyph = SEASON_GLYPH[season];

  return (
    <div
      className={`${styles.wrap} ${styles[season]}`}
      role="img"
      aria-label={season}
    >
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        aria-hidden
      >
        <defs>
          <radialGradient id={`grad-${season}`} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={`var(--accent-${season}-grad-start)`}
            />
            <stop
              offset="100%"
              stopColor={`var(--accent-${season}-grad-end)`}
            />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill={`url(#grad-${season})`} />
        {season === 'spring' &&
          [25, 70, 130, 165].map((cx, i) => (
            <circle
              key={i}
              cx={cx}
              cy={20 + (i % 2) * 160}
              r="6"
              fill="var(--accent-spring)"
              opacity="0.45"
            />
          ))}
        {season === 'summer' &&
          [30, 60, 90, 120, 150].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1={170 + (i % 2) * 8}
              x2={x - 4}
              y2={186 + (i % 2) * 8}
              stroke="var(--accent-summer)"
              strokeWidth="2"
              opacity="0.55"
            />
          ))}
        {season === 'autumn' &&
          [40, 80, 140, 170].map((cx, i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={30 + (i % 2) * 140}
              rx="8"
              ry="4"
              fill="var(--accent-autumn)"
              opacity="0.5"
              transform={`rotate(${30 + i * 20} ${cx} ${30 + (i % 2) * 140})`}
            />
          ))}
        {season === 'winter' &&
          [30, 80, 130, 175].map((cx, i) => (
            <text
              key={i}
              x={cx}
              y={30 + (i % 2) * 150}
              fontSize="14"
              fill="var(--accent-winter)"
              opacity="0.6"
              textAnchor="middle"
            >
              ❄
            </text>
          ))}
      </svg>
      <span className={styles.glyph}>{glyph}</span>
    </div>
  );
}
