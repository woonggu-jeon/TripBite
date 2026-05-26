/**
 * i18n 설정
 *
 * 지원 언어 추가 절차:
 *   1) locales 배열에 코드 추가 (예: 'ja')
 *   2) src/i18n/messages/{code}.json 추가
 *   3) localeLabels 에 표시명 추가
 *
 * 그 외 코드 변경은 필요 없습니다 — 모든 i18n 헬퍼가 이 파일을 참조합니다.
 */
export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

/** UI 표시용 라벨 (LanguageSwitcher에서 사용) */
export const localeLabels: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

/** 쿠키명 — next-intl 관례에 맞춰 NEXT_LOCALE 사용 */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** 타입 가드 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
