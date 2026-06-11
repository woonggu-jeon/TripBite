'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import styles from './LuckyColor.module.scss';

/**
 * 토너먼트 우승 destination.id 를 seed 로 사용해 deterministic 한
 * 행운의 색(hex) + 색 이름(한국어/영문) 표시.
 *
 * 같은 destination 우승 시 항상 같은 색이 나옴(공유 카드/저장 시 일관).
 */

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

export function LuckyColor({ seed }: { seed: string }) {
  const t = useTranslations('tournament.result.color');

  const { hex, key } = useMemo(() => {
    const h = hashSeed(seed) % 360;
    return { hex: hslToHex(h, 70, 55), key: colorKeyFromHue(h) };
  }, [seed]);

  const name = (() => {
    switch (key) {
      case 'red':
        return t('red');
      case 'orange':
        return t('orange');
      case 'yellow':
        return t('yellow');
      case 'green':
        return t('green');
      case 'teal':
        return t('teal');
      case 'blue':
        return t('blue');
      case 'purple':
        return t('purple');
      case 'pink':
        return t('pink');
    }
  })();

  return (
    <section
      className={styles.box}
      aria-label={`${t('label')}: ${name} ${hex}`}
    >
      <div className={styles.info}>
        <p className={styles.title}>{t('label')}</p>
        <p className={styles.name}>{name}</p>
        <p className={styles.hex}>{hex}</p>
      </div>
      <div className={styles.swatch} style={{ background: hex }} aria-hidden />
    </section>
  );
}
