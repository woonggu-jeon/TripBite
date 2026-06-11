import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

/**
 * next-intl 의 i18n routing 설정.
 *
 * localePrefix: 'as-needed' — default locale (ko) 은 URL prefix 없음, 다른 locale 만 prefix.
 *   - ko (default): `/region/cheongju`
 *   - en:           `/en/region/cheongju`
 *
 * 이 정책으로:
 *   - 기존 한국어 URL 변경 0 (외부 링크 / SEO 호환)
 *   - 영어 사용자만 `/en/` prefix
 *   - hreflang alternates 가능 (URL 분리)
 *   - ISR/static generation 가능 (URL 자체가 locale 정보 → cookies() 호출 불필요)
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});
