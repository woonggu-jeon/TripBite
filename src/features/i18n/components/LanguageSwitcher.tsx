'use client';

import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocale as setLocaleAction } from '@/i18n/actions';
import { type Locale, localeLabels, locales } from '@/i18n/config';
import styles from './LanguageSwitcher.module.scss';

/**
 * 언어 전환 UI
 *
 * 실시간 전환 흐름:
 *   1) 사용자 클릭
 *   2) startTransition 안에서 setLocale 서버 액션 호출
 *      → 서버가 NEXT_LOCALE 쿠키 set + revalidatePath('/', 'layout')
 *   3) router.refresh() — 모든 RSC를 새 locale로 재요청
 *   4) NextIntlClientProvider 가 새 messages를 받아 Client Component 재렌더
 *
 * isPending 동안 UI가 잠깐 약하게(opacity) 표시되어 전환 중임을 알림.
 *
 * 사용처:
 *   - SettingsDropdown 안의 "언어" 섹션
 *   - 또는 마이페이지의 설정 섹션
 *   - 또는 비로그인 페이지에서도 단독 사용 가능
 */
export function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations('settings');
  const [isPending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === current) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div className={styles.wrap} data-pending={isPending ? '' : undefined}>
      <div className={styles.sectionTitle}>{t('language')}</div>
      <ul className={styles.list} role="listbox" aria-label={t('language')}>
        {locales.map((loc) => {
          const selected = loc === current;
          return (
            <li key={loc}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={isPending}
                onClick={() => change(loc)}
                className={`${styles.item} ${selected ? styles.selected : ''}`}
              >
                <span>{localeLabels[loc]}</span>
                {selected && <Check size={16} />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
