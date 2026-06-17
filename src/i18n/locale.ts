import 'server-only';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';

/**
 * 서버 측 로케일 읽기
 *
 * - Server Components / Route Handlers / Server Actions 에서 사용
 * - 쿠키 미존재 또는 알 수 없는 값 → defaultLocale 반환
 *
 * Note: client 측에선 useLocale() (from 'next-intl') 사용
 */
export async function readLocaleFromCookie(): Promise<Locale> {
  const c = await cookies();
  const value = c.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}
