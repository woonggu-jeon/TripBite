'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, type Locale, isLocale } from './config';

/**
 * 로케일 변경 Server Action
 *
 * 흐름 (사용자 입장에서 "실시간 전환"):
 *   1) 사용자가 LanguageSwitcher에서 언어 클릭
 *   2) 이 액션이 NEXT_LOCALE 쿠키 set
 *   3) revalidatePath('/', 'layout') 로 모든 RSC 캐시 무효화
 *   4) 클라이언트에서 router.refresh() 호출 (LanguageSwitcher 내부)
 *   5) 새 로케일로 모든 페이지 재렌더 — URL 변경 없음
 *
 * 왜 Server Action 인가?
 *   - 쿠키는 HTTP 응답으로 내려야 함 (브라우저 JS의 document.cookie도 가능하지만,
 *     RSC 캐시 무효화를 함께 처리하려면 서버 액션이 깔끔)
 *   - SSR 환경에서 다음 요청부터 새 locale로 messages 로드 보장
 */
export async function setLocale(next: Locale): Promise<{ ok: boolean }> {
  if (!isLocale(next)) return { ok: false };

  const c = await cookies();
  c.set(LOCALE_COOKIE, next, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1년
    sameSite: 'lax',
    // production HTTPS에서만 활성화
    secure: process.env.NODE_ENV === 'production',
  });

  // 모든 페이지의 RSC 캐시를 무효화하여 다음 렌더에서 새 messages 사용
  revalidatePath('/', 'layout');

  return { ok: true };
}
