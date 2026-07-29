'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RadioGroup, RadioOption } from '@/components/ui';
import { type ThemeMode, useUIStore } from '@/stores/ui-store';
import styles from './ThemeSection.module.scss';

/**
 * <ThemeSection /> — Settings 의 테마 선택.
 *
 * 3 옵션 segmented radio:
 *   - system : prefers-color-scheme 따름 (기본값)
 *   - light  : 명시 light 강제
 *   - dark   : 명시 dark 강제
 *
 * 선택 즉시 ThemeApplier 가 <html data-theme> 적용 + localStorage persist.
 */
const OPTIONS: {
  value: ThemeMode;
  Icon: typeof Monitor;
  labelKey: 'system' | 'light' | 'dark';
}[] = [
  { value: 'system', Icon: Monitor, labelKey: 'system' },
  { value: 'light', Icon: Sun, labelKey: 'light' },
  { value: 'dark', Icon: Moon, labelKey: 'dark' },
];

export function ThemeSection() {
  const t = useTranslations('settings.theme');
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <RadioGroup label={t('label')} className={styles.row}>
      {OPTIONS.map(({ value, Icon, labelKey }) => {
        const isActive = theme === value;
        return (
          <RadioOption
            key={value}
            checked={isActive}
            onSelect={() => setTheme(value)}
            className={`${styles.option} ${isActive ? styles.active : ''}`}
          >
            <Icon size={16} aria-hidden />
            <span>{t(labelKey)}</span>
          </RadioOption>
        );
      })}
    </RadioGroup>
  );
}
