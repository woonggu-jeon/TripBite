import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation primitives.
 *
 * `next/link`, `next/navigation` 대신 이 파일의 wrapper 를 사용 — 현재 locale 에 맞게
 * URL prefix 자동 추가.
 *
 * 사용 (next/link 대체):
 *   import { Link } from '@/i18n/navigation';
 *   <Link href="/region/cheongju">청주</Link>
 *
 * 사용 (next/navigation 대체):
 *   import { useRouter, usePathname, redirect } from '@/i18n/navigation';
 *
 * locale 명시 navigate (다른 locale 로 이동):
 *   router.replace('/region/cheongju', { locale: 'en' })
 *   → URL: /en/region/cheongju
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
