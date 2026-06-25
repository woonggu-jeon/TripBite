import Image from 'next/image';

/**
 * 토너먼트 테마 아이콘 — Figma "themeIcon" 정합 (2026-06-25).
 *
 * theme:
 *   - season: 계절 선택 (봄/여름/가을/겨울)
 *   - dice: 랜덤
 *
 * asset: `public/icons/themes/{theme}.png` — Figma export PNG (36×36 base).
 */
export type ThemeKind = 'season' | 'dice';

const THEME_ALT: Record<ThemeKind, string> = {
  season: '계절',
  dice: '랜덤',
};

interface Props {
  theme: ThemeKind;
  size?: number;
  className?: string;
}

export function ThemeIcon({ theme, size = 36, className }: Props) {
  return (
    <Image
      src={`/icons/themes/${theme}.png`}
      alt={THEME_ALT[theme]}
      width={size}
      height={size}
      className={className}
    />
  );
}
